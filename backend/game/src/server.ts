import fastify, { FastifyRequest, FastifyInstance } from "fastify";
import FastifyWebsocket from '@fastify/websocket';
import fastifyJwt from "fastify-jwt";
import { gameRoutes } from "./routes/game.routes";
import { WebSocket } from 'ws';
import { logError } from "./utils/errorHandler";
import { connectRabbit } from "./rabbit/rabbit";
import config from "./config";
import { createAndStartGame, createAndStartAIGame, updatePlayerPosition, receiveGameReady } from "./services/game.service";
import { createTournament, joinTournament, toggleReady } from "./services/tournament.service";
import { JwtPayload } from "./@types/user.types";
//import { TournamentWebSocketMessage } from "./@types/tournament.types";

// Import the database connection - auto launches the connection
import "./database";

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
		console.log(`User ${userId} disconnected`);
		activeConnections.delete(userId);
	  });
	  
	  connection.on('message', async (message: any) => {
		//const data = JSON.parse(message) as TournamentWebSocketMessage;
		const data = JSON.parse(message);
		console.log('Received message:', data);
	
		try {
			switch (data.type) {
				case 'create_tournament':
					const tournamentId = await createTournament(userId);
					connection.send(JSON.stringify({
						type: 'tournament_created',
						payload: { tournamentId, hostId: userId }
					}));
					sendNotificationToAll({
						type: 'new_tournament_created',
						payload: { tournamentId, hostId: userId }
					});
					break;
				case 'join_tournament':
						await joinTournament(Number(data.payload.tournamentId), userId);
					break;
				case 'toggle_ready':
					await toggleReady(Number(data.payload.tournamentId), userId, data.payload.ready);
					break;
				case 'start_ai_game':
					const gameId = await createAndStartAIGame(userId, data.payload.difficulty);
					connection.send(JSON.stringify({
						type: 'game_created',
						payload: { gameId },
						isAiGame: true
					}));
					break;
				case 'game_invite': 
					sendNotification(data.payload.friendId, {
						type: 'game_invitation_income',
						payload: { fromUserId: userId }
					});
					break;
				case 'game_invitation_accepted':
					const gameUserId = await createAndStartGame({player_1_id: userId, player_2_id: data.payload.friendId});
					sendNotification(data.payload.friendId, {
						type: 'game_invitation_accepted',
						payload: { fromUserId: userId }
					});
					setTimeout(() => {}, 2000);
					sendNotification(userId, {
						type: 'game_created',
						payload: { 
							gameId: gameUserId,
						    isPlayer1: true
						}
					});
					sendNotification(data.payload.friendId, {
						type: 'game_created',
						payload: { 
							gameId: gameUserId,
							isPlayer1: false
						}
					});
					
					break;
				case 'game_invitation_rejected':
					sendNotification(data.payload.friendId, {
						type: 'game_invitation_rejected',
						payload: { fromUserId : userId}});
					break;
				case 'player_move':
					updatePlayerPosition(data.gameId, data.userId, data.direction);
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
				case 'game_ready':
					receiveGameReady(data.payload.gameId, userId);
					break;
				default:
					console.log('Unknown message type:', data.type);
					break;
			}
		} catch (error) {
			console.error('Error processing message:', error);
			connection.send(JSON.stringify({
				type: 'error',
				payload: { message: error instanceof Error ? error.message : 'Unknown error' }
			}));
		}
	  });

	  connection.on('error', (error: Error) => {
		console.error(`WebSocket error for user ${userId}:`, error);
	  });
	});
  });

interface NotificationData {
	type: string;
	payload: unknown;
}

interface GameNotificationData {
	type: string;
	gameId: number;
	payload: {
		players: {
			p1: { x: number; y: number; score: number };
			p2: { x: number; y: number; score: number };
		};
		ball: {
			x: number;
			y: number;
		};
	}
}

interface GameResultPayload {
	type: string,
	gameId: number,
	winnerId: number,
	score1: number,
	score2: number,
}

export function sendNotification(userId: number, data: NotificationData | GameNotificationData | GameResultPayload) {

	if(!userId || userId === 999999)
		return;

	const ws = activeConnections.get(userId);
	
	if (ws && ws.readyState === WebSocket.OPEN) {
		try {
			ws.send(JSON.stringify(data));
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
				console.log('Sending notification to all users:', data);
				console.log('To users with active connections:', activeConnections.keys());
				ws.send(JSON.stringify(data));
			} catch (error) {
				console.error('Error sending notification:', error);
			}
		}
	}
}

server.setErrorHandler((error: Error, request: any, reply: any) => {
	logError(error, 'Server');
	reply.status(error || 500).send({
	  error: error.message || 'Internal Server Error',
	  statusCode: error || 500,
	});
  });

server.register(gameRoutes);

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

start();