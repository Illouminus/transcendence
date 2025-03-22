import fastify, { FastifyRequest } from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyMultipart from "@fastify/multipart";
import FastifyWebsocket from '@fastify/websocket';

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
const server = fastify({
	logger : config.server.env === "development",
	disableRequestLogging: config.server.env === "production",
});


server.register(FastifyWebsocket);

const activeConnections = new Map<number, WebSocket>();

server.register(async function (fastify) {
    fastify.get('/ws', { websocket: true }, (connection /* SocketStream */, req /* FastifyRequest */) => {
      connection.on('message', (message: unknown) => {
        // message.toString() === 'hi from client'
		if (typeof message === 'string' || message instanceof Buffer) {
			console.log(message.toString());
		} else {
			console.log('Received non-string message');
		}
        connection.send('hi from server yep')
      })
    })
  })


function sendNotification(userId: number, data: any) {
	const ws = activeConnections.get(userId);
	if (ws && ws.readyState === ws.OPEN) {
	  ws.send(JSON.stringify(data));
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