import fastify, {FastifyRequest, FastifyInstance} from "fastify";
import FastifyWebsocket from "@fastify/websocket";
import cors from "@fastify/cors";
import fastifyJwt from "fastify-jwt";
import chatRoutes from "./routes/chat.routes";
import { logError } from "./utils/errorHandler";
import config from "./config";
import { connectRabbit } from "./rabbit/rabbit";
import { WebSocket } from "ws";
import { JwtPayload } from "./@types/chat.types";

// Importation de la base de données
import "./database";

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
			console.log("🔑 Token reçu: " + token);

			const payload = server.jwt.verify(token) as JwtPayload;
			console.log("✅ JWT payload verified:", payload);

			const userId = payload.userId;
			if (!userId) {
				console.log("❌ Payload invalid, userId non trouvé");
				connection.socket.close(4002, "Invalid token");
				return;
			}

			// Ajout de la connexion à la liste active
			activeConnections.set(userId, connection.socket);
			console.log(`✅ User ${userId} connected via WebSocket`);


			// Gestion des messages reçus
			connection.socket.on('message', (message: string) => {
				try {
					const data = JSON.parse(message.toString());
					console.log(`💬 Message reçu de ${userId}:`, data);

					// Exemple de traitement des messages
					if (data.type === 'chat_message') {
						const { content, recipientId } = data.payload;
						sendNotification(recipientId, {
							type: 'new_message',
							payload: { senderId: userId, content },
						});
					}
				} catch (err) {
					console.error(`❌ Erreur de traitement du message pour ${userId}:`, err);
				}
			});

			// Gestion de la déconnexion
			connection.socket.on('close', () => {
				console.log(`❌ User ${userId} disconnected`);
				activeConnections.delete(userId);

			});

			// Gestion des erreurs
			connection.socket.on('error', (error: string) => {
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
    const ws = activeConnections.get(receiverId); // Utiliser receiverId ici

    // Vérifie si la connexion WebSocket pour le destinataire est présente
    if (!ws) {
        console.log(`WebSocket for user ${receiverId} not found in active connections`);
        return;
    }

    // Vérifie si le WebSocket est ouvert pour le destinataire
    if (ws.readyState !== WebSocket.OPEN) {
        console.log(`WebSocket for user ${receiverId} is not available or not open. ReadyState:`, ws.readyState);
        return;
    }

    try {
        // Envoie la notification
        ws.send(JSON.stringify(data));
        console.log('Notification sent successfully to user', receiverId);
    } catch (error) {
        console.error('Error sending notification:', error);
        activeConnections.delete(receiverId);  // Nettoyer la connexion en cas d'erreur
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
