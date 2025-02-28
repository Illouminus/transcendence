import fastify from "fastify";
import fastifyCookie from "@fastify/cookie";
import cors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import authRoutes from "./routes/auth.routes";
import { logError } from "./utils/errorHandler";
import { connectRabbit } from "./rabbit/rabbit";
import config from "./config";

// Import the database connection - auto launches the connection
import "./database";


connectRabbit();


// Expand the Fastify instance with a new method to authenticate the user
declare module "fastify" {
	interface FastifyInstance {
		authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
	}
} 



// Create an instance of Fastify server
const server = fastify({
	logger : config.server.env === "development",
	disableRequestLogging: config.server.env === "production",
});

// Register the CORS plugin with our configuration
// server.register(cors, {
// 	origin: config.server.corsOrigin,
// 	credentials: true,
//   });


// Register the cookie plugin with our configuration  
server.register(fastifyCookie, {
	secret: config.security.cookieSecret,
	parseOptions: {
	  httpOnly: true,
	  secure: config.server.env === 'production',
	  sameSite: 'none',
	},
  });


// Register the JWT plugin with our configuration
server.register(fastifyJwt, {
	secret: config.security.jwtSecret,
	sign: {
		expiresIn: config.security.jwtExpiresIn,
	}
});



// Create an authentication hook to check if the user is authenticated
// This hook will be called before every route that uses it
// For example, if you want to protect a route, you can use the authenticate hook like this:
// server.get("/protected-route", { preHandler: server.authenticate }, yourRouteHandler);
// server.decorate("authenticate", async (req: FastifyRequest, reply: FastifyReply) => {
// 	try {
// 		await authMe(req, reply);
// 	} catch (err) {
// 		reply.status(401).send({ error: "Unauthorized" });
// 		console.error(err);
// 	}
// });


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
// For example, if you have a route in the authRoutes file with the path /login, you can access it at http://localhost:5000/auth/login
server.register(authRoutes);


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