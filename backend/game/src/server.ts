import fastify from "fastify";
import { gameRoutes } from "./routes/game.routes";
import { logError } from "./utils/errorHandler";
import { connectRabbit } from "./rabbit/rabbit";
import config from "./config";

// Import the database connection - auto launches the connection
import "./database";

//connectRabbit();

// Create an instance of Fastify server
const server = fastify({
	logger : config.server.env === "development",
	disableRequestLogging: config.server.env === "production",
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