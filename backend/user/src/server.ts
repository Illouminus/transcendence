import fastify, { FastifyRequest, FastifyInstance } from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyMultipart from "@fastify/multipart";
import FastifyWebsocket from '@fastify/websocket';
import { WebSocket } from 'ws';
import fastifyJwt from "fastify-jwt";
import userRoutes from "./routes/users.routes";
import friendsRoutes from "./routes/friends.routes";
import { logError } from "./utils/errorHandler";
import config from "./config";
import { connectRabbit } from "./rabbit/rabbit";

// Import the database connection - auto launches the connection
import "./database";
import { JwtPayload } from "./@types/user.types";
connectRabbit();

// Create an instance of Fastify server
const server: FastifyInstance = fastify({
	logger: config.server.env === "development",
	disableRequestLogging: config.server.env === "production",
});

server.register(fastifyJwt, { secret: config.security.jwtSecret });
server.register(FastifyWebsocket);

const activeConnections = new Map<number, WebSocket>();

server.register(async function (fastify: FastifyInstance) {
	fastify.get('/ws', { websocket: true }, (connection: any, req: FastifyRequest<{ Querystring: { token: string } }>) => {
		const token = req.query.token;  
		const payload = server.jwt.verify(token) as JwtPayload;
		
		activeConnections.set(payload.userId, connection);
		

		// Handle connection close
		connection.on('close', () => {
			console.log(`User ${payload.userId} disconnected`);
			activeConnections.delete(payload.userId);
			console.log('Remaining connections:', Array.from(activeConnections.keys()));
		});

		// Handle incoming messages
		connection.on('message', (message: any) => {
			console.log(`Received message from user ${payload.userId}:`, message.toString());
			connection.send('hi from server yep');
		});

		// Handle errors
		connection.on('error', (error: any) => {
			console.error(`WebSocket error for user ${payload.userId}:`, error);
			activeConnections.delete(payload.userId);
		});
	});
});

interface NotificationData {
	type: string;
	payload: unknown;
}

export function sendNotification(userId: number, data: NotificationData) {
	console.log('sendNotification to', userId, ' => activeConnections has keys:', [...activeConnections.keys()]);
	const ws = activeConnections.get(userId);
	console.log("All active connections", activeConnections);
	console.log('the ws object is', ws);
	console.log('sending notification to user', userId);
	console.log('Active connections:', Array.from(activeConnections.keys()));
	console.log('WS connection exists:', !!ws);
	
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

// Register the Multipart plugin with our configuration for file uploads
server.register(fastifyMultipart, {
	limits: {
		fileSize: config.files.maxFileSize,
	},
	attachFieldsToBody: 'keyValues',
});


// Register the static plugin with our configuration - to serve images from the public folder
// For example, if you have an image in the public/images folder called my-image.jpg, you can access it at http://localhost:5000/images/my-image.jpg
// As usual HTTP requests, you can access the image by using the URL http://localhost:5000/images/my-image.jpg
server.register(fastifyStatic, {
	root: config.files.uploadsDir,
	prefix: "/images/",
	decorateReply: false,
});


// Set error handler for the server to log errors
// This will log the error and return a JSON response with the error message and status code
// For example, if you throw a new Error("Something went wrong") in a route handler, the error handler will catch it and return a JSON response like this:
// {
//   "error": "Something went wrong",
//   "statusCode": 500
// }


server.setErrorHandler((error, request, reply) => {
	logError(error, 'Server');
	reply.status(error.statusCode || 500).send({
	  error: error.message || 'Internal Server Error',
	  statusCode: error.statusCode || 500,
	});
  });
  

// Register the routes - prefix means that all routes in the authRoutes will start with /auth
// For example, if you have a route in the authRoutes file with the path /login, you can access it at http://localhost:5000/user/update
server.register(userRoutes);
server.register(friendsRoutes , { prefix: '/friends' });


// server.get('/testWebsocket', { websocket: true}, (socket, req: FastifyRequest) => {
// 	socket.on('message', (msg) => {
// 		socket.send(msg);
// 	});
// })


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
		console.log(`🚀 Server listening at ${address}`);
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