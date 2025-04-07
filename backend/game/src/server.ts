import fastify, { FastifyRequest, FastifyInstance } from "fastify";
import FastifyWebsocket from '@fastify/websocket';
import fastifyJwt from "fastify-jwt";
import { gameRoutes } from "./routes/game.routes";
import { WebSocket } from 'ws';
import { logError } from "./utils/errorHandler";
import { connectRabbit } from "./rabbit/rabbit";
import config from "./config";

// Import the database connection - auto launches the connection
import "./database";
import { JwtPayload } from "./@types/user.types";
import { createAndStartGame, updatePlayerPosition } from "./services/game.service";
import { insertMatchmakingQueue, startOrdinaryGame } from "./models/game.model";

//connectRabbit();

// Create an instance of Fastify server
const server = fastify({
	logger : config.server.env === "development",
	disableRequestLogging: config.server.env === "production",
});

server.register(fastifyJwt, { secret: config.security.jwtSecret });
server.register(FastifyWebsocket);


const activeConnections = new Map<number, WebSocket>();

server.register(async function (fastify: FastifyInstance) {
	fastify.get('/ws', { websocket: true }, async (connection: any, req: FastifyRequest<{ Querystring: { token: string } }>) => {
	  const token = req.query.token;  
	  const payload = server.jwt.verify(token) as JwtPayload;
	  
	  const {userId} = payload;
	  console.log('User ID from token:', userId);

	  if (!userId) {
		connection.close(4000, 'User not found');
		return;
	  }

	  activeConnections.set(userId, connection);
	  
	  connection.on('close', () => {
		console.log(`User ${payload.userId} disconnected`);
		activeConnections.delete(payload.userId);
	  });
	  
	  connection.on('message', async (message: any) => {
		const data = JSON.parse(message);
		console.log('Received message:', data);
	

		switch (data.type) {
			case 'game_invite': 
			sendNotification(data.payload.friendId, {
				type: 'game_invitation_income',
				payload: { fromUserId : userId}});
				break;
			case 'game_invitation_accepted':
				sendNotification(data.payload.friendId, {
					type: 'game_invitation_accepted',
					payload: { fromUserId : userId}});
				break;
			case 'game_invitation_rejected':
				sendNotification(data.payload.friendId, {
					type: 'game_invitation_rejected',
					payload: { fromUserId : userId}});
				break;
			case 'game_start':
				const gameId = await createAndStartGame(data);
				connection.send(JSON.stringify({ type: 'game_start', message: 'Game is starting!', gameId: gameId }));
				break;
			case 'player_move':
				updatePlayerPosition(data.gameId, data.userId, data.direction);
				// Обработка движения игрока
				connection.send(JSON.stringify({ type: 'player_move', message: `Player ${data.userId} moved to (${data.direction})` }));
				break;
			case 'game_end':
				connection.send(JSON.stringify({ type: 'game_end', message: 'Game has ended!' }));
				break;
			case 'game_update':
				connection.send(JSON.stringify({ type: 'game_update', message: 'Game state updated!' }));
				break;
			case 'game_statistics':
				connection.send(JSON.stringify({ type: 'game_statistics', message: 'Game statistics updated!' }));
				break;
			case 'game_error':
				connection.send(JSON.stringify({ type: 'game_error', message: 'An error occurred in the game!' }));
				break;
			default:
				break;
		}

	  });

	  connection.on('error', (error: any) => {
		console.error(`WebSocket error for user ${payload.userId}:`, error);
		//activeConnections.delete(payload.userId);
	  });
	});
  });

interface NotificationData {
	type: string;
	payload: unknown;
}

export function sendNotification(userId: number, data: NotificationData) {

	activeConnections.forEach((ws, id) => {
		console.log(`User ID: ${id}, WebSocket: ${ws.readyState}`);
	})

	const ws = activeConnections.get(userId);
	
	if (ws && ws.readyState === WebSocket.OPEN) {
		try {
			ws.send(JSON.stringify(data));
			console.log('Notification sent successfully to user', userId);
		} catch (error) {
			console.error('Error sending notification:', error);
			activeConnections.delete(userId);
		}
	} else {
		console.log(`WebSocket for user ${userId} is not available or not open. ReadyState:`, ws?.readyState);
	}
}


export function sendNotificationToAll(data: NotificationData) {

	for (const ws of activeConnections.values()) {
		if (ws.readyState === WebSocket.OPEN) {
			try {
				ws.send(JSON.stringify(data));
			} catch (error) {
				console.error('Error sending notification:', error);
			}
		}
	}

}


server.setErrorHandler((error, request, reply) => {
	logError(error, 'Server');
	reply.status(error.statusCode || 500).send({
	  error: error.message || 'Internal Server Error',
	  statusCode: error.statusCode || 500,
	});
  });

// Register the routes - prefix means that all routes in the authRoutes will start with /auth
// For example, if you have a route in the authRoutes file with the path /login, you can access it at http://localhost:5000/user/update
server.register(gameRoutes);


// Start the server
// The server will listen on the port and host specified in the config file
const start = async () => {
	try {
	  await server.listen({ 
		port: config.server.port, 
		host: config.server.host 
	  });

	  const address = server.server.address();
	  if (address) {
		console.log(`🚀 Server listening at ${config.server.port} on ${config.server.host}`);
	  } else {
		console.error("Failed to get server address");
	  }
	} catch (err) {
	  logError(err, 'Server Startup');
	  process.exit(1);
	}
  };


// Start the server
start();