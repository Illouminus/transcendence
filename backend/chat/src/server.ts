import fastify, {FastifyRequest} from "fastify";
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
const server = fastify({
	logger: config.server.env === "development",
	disableRequestLogging: config.server.env === "production",
});

console.log("✅ Server instance created");

// Active les CORS
server.register(cors, {
	origin: config.server.corsOrigin,
	credentials: true,
});
console.log("✅ CORS registered");

// Active JWT pour les connexions WebSocket
server.register(fastifyJwt, { secret: config.security.jwtSecret });
console.log("✅ JWT registered");

// Enregistrement du plugin WebSocket
server.register(FastifyWebsocket);
console.log("✅ WebSocket plugin registered");

// Map pour stocker les connexions WebSocket actives
const activeConnections = new Map<number, WebSocket>();

// Route WebSocket
server.register(async function (fastify) {
	fastify.get('/ws', { websocket: true }, async (connection: any, req: FastifyRequest<{ Querystring: { token: string } }>) => {
		console.log("⚡ WebSocket connection initiated");
		try {
			// Vérification du token JWT
			const token = req.query.token as string;
			if (!token) {
				console.log("❌ Token absent dans la requête");
				connection.socket.close(4001, "Token required");
				return;
			}

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

			// Notification de connexion
			broadcastNotification({
				type: 'user_connected',
				payload: { userId },
			});

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

				// Notification de déconnexion
				broadcastNotification({
					type: 'user_disconnected',
					payload: { userId },
				});
			});

			// Gestion des erreurs
			connection.socket.on('error', (error: string) => {
				console.error(`⚠️ Erreur WebSocket pour l'utilisateur ${userId}:`, error);
				activeConnections.delete(userId);
			});
		} catch (err) {
			console.error("❌ Erreur de connexion WebSocket:", err);
			connection.socket.close(4001, "Invalid token");
		}
	});
});

// Fonction pour envoyer une notification à un utilisateur spécifique
function sendNotification(userId: number, data: Record<string, any>) {
	console.log(`📤 Tentative d'envoi de notification à ${userId}`);
	const ws = activeConnections.get(userId);
	if (ws && ws.readyState === WebSocket.OPEN) {
		try {
			ws.send(JSON.stringify(data));
			console.log(`✅ Notification envoyée à ${userId}`);
		} catch (err) {
			console.error(`❌ Erreur d'envoi de notification à ${userId}:`, err);
			activeConnections.delete(userId);
		}
	} else {
		console.log(`⚠️ Connexion WebSocket pour ${userId} indisponible`);
	}
}

// Fonction pour envoyer une notification à tous les utilisateurs
function broadcastNotification(data: Record<string, any>) {
	console.log("📢 Broadcast notification en cours...");
	for (const [userId, ws] of activeConnections.entries()) {
		if (ws.readyState === WebSocket.OPEN) {
			try {
				ws.send(JSON.stringify(data));
				console.log(`✅ Notification broadcast envoyée à ${userId}`);
			} catch (err) {
				console.error("❌ Erreur d'envoi de broadcast:", err);
			}
		} else {
			console.log(`⚠️ Connexion pour ${userId} fermée pendant le broadcast`);
		}
	}
}

// Enregistrement des routes HTTP du chat
server.register(chatRoutes, { prefix: "/chat" });
console.log("✅ Chat routes registered");

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
