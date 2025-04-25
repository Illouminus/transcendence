import fastify, { FastifyRequest, FastifyInstance } from "fastify";
import FastifyWebsocket from "@fastify/websocket";
import cors from "@fastify/cors";
import fastifyJwt from "fastify-jwt";
import chatRoutes from "./routes/chat.routes";
import { logError } from "./utils/errorHandler";
import config from "./config";
import { connectRabbit } from "./rabbit/rabbit";
import { WebSocket } from "ws";
import { JwtPayload } from "./@types/chat.types";
import { sendSingleMessage } from './controllers/chat.controller'

// Importation de la base de données
import "./database";
import { stringify } from "querystring";

// Connexion à RabbitMQ
connectRabbit();

// Création du serveur Fastify
const server: FastifyInstance = fastify({
	logger: config.server.env === "development",
	disableRequestLogging: config.server.env === "production",
});

// Active les CORS
server.register(cors, {
	origin: config.server.corsOrigin,
	credentials: true,
});

// Active JWT pour les connexions WebSocket
server.register(fastifyJwt, { secret: config.security.jwtSecret });
server.register(FastifyWebsocket);

// Map pour stocker les connexions WebSocket actives
const activeConnections = new Map<number, WebSocket>();

// Route WebSocket
server.register(async function (fastify: FastifyInstance) {
	fastify.get('/ws', { websocket: true }, async (connection: any, req: FastifyRequest<{ Querystring: { token: string } }>) => {
			// Vérification du token JWT
			const token = req.query.token; 
			if (!token) {
				console.log("❌ Token absent dans la requête");
				connection.socket.close(4001, "Token required");
				return;
			}
			const payload = server.jwt.verify(token) as JwtPayload;

			const userId = payload.userId;
			console.log("✅ Connexion WebSocket établie pour l'utilisateur:", userId);
			if (!userId) {
				console.log("❌ Payload invalid, userId non trouvé");
				connection.socket.close(4002, "Invalid token");
				return;
			}

			// Ajout de la connexion à la liste active
			activeConnections.set(userId, connection);

			// Gestion des messages reçus
			connection.on('message', (message: string) => {
				const data = JSON.parse(message);

				// Vérification du type de message
				if (data.type == "chat_send") {
					console.log('Message envoyé:', data.payload);
					sendSingleMessage(
						data.payload.fromUserId, 
						data.payload.toUserId, 
						data.payload.text)
						
					sendNotification(data.payload.toUserId, {
						type: "chat_receive",
						payload: { 
							username: data.payload.username,
							fromUserId: data.payload.fromUserId, 
							toUserId: data.payload.toUserId, 
							text: data.payload.text,
							sent_at: data.payload.sent_at},
					});
				}
			});

			// Gestion de la déconnexion
			connection.on('close', () => {
				console.log(`❌ User ${userId} disconnected`);
				activeConnections.delete(userId);

			});

			// Gestion des erreurs
			connection.on('error', (error: string) => {
				console.error(`⚠️ Erreur WebSocket pour l'utilisateur ${userId}:`, error);
				activeConnections.delete(userId);
			});
	});
});



interface NotificationData {
	type: string;
	payload: unknown;
}

export function sendNotification(receiverId: number, data: NotificationData) {
    console.log('Send Notification Called');
    const connection = activeConnections.get(receiverId);

    // Vérifie si la connexion WebSocket pour le destinataire est présente
    if (!connection) {
        console.log(`WebSocket for user ${receiverId} not found in active connections`);
        return;
    }

    try {
        // Envoie la notification
        connection.send(JSON.stringify(data));
        console.log('Notification sent successfully to user', receiverId);
    } catch (error) {
        console.error('Error sending notification:', error);
        activeConnections.delete(receiverId);
    }
}




server.register(chatRoutes, { prefix: "/chat" });


// Gestion centralisée des erreurs
server.setErrorHandler((error, request, reply) => {
	logError(error, "Server");
	console.error("❌ Erreur attrapée par setErrorHandler:", error);
	reply.status(error.statusCode || 500).send({
		error: error.message || "Internal Server Error",
		statusCode: error.statusCode || 500,
	});
});

// Démarrage du serveur
const start = async () => {
	try {
		await server.listen({
			port: config.server.port,
			host: config.server.host,
		});

		console.log(`🚀 Chat server listening at ${config.server.host}:${config.server.port}`);
	} catch (err) {
		logError(err, "Server Startup");
		console.error("❌ Erreur au démarrage du serveur:", err);
		process.exit(1);
	}
};

start();
