import fastify from "fastify";
import FastifyWebsocket from "@fastify/websocket";
import cors from "@fastify/cors";
import chatRoutes from "./routes/chat.routes"; // ✅ Routes du chat uniquement
import { logError } from "./utils/errorHandler";
import config from "./config";
import { connectRabbit } from "./rabbit/rabbit";

// Importation de la base de données (lance automatiquement la connexion)
import "./database";

// Connexion à RabbitMQ
connectRabbit();



// Création du serveur Fastify
const server = fastify({
	logger: config.server.env === "development",
	disableRequestLogging: config.server.env === "production",
});


server.register(cors, {
	origin: config.server.corsOrigin,
	credentials: true,
  });

// Enregistrement du plugin WebSocket
server.register(FastifyWebsocket);

server.register(async function (fastify) {
	fastify.get("/ws", { websocket: true }, (connection, req) => {
		connection.on("message", (message: unknown) => {
			connection.send("Message reçu par le serveur");
		});
	});
});

// Gestion centralisée des erreurs
server.setErrorHandler((error, request, reply) => {
	logError(error, "Server");
	reply.status(error.statusCode || 500).send({
		error: error.message || "Internal Server Error",
		statusCode: error.statusCode || 500,
	});
});

// Enregistrement des routes du chat uniquement
server.register(chatRoutes, { prefix: "/chat" });

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
		process.exit(1);
	}
};

start();
