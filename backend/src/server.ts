import fastify, { FastifyRequest, FastifyReply } from "fastify";
import fastifyCookie from "@fastify/cookie";
import fastifyFormbody from "@fastify/formbody";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import fastifyMultipart from "@fastify/multipart";
import fastifyJwt from "@fastify/jwt";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/users.routes";
import path from "path";
import "./database";
import { authMe } from "./controllers/auth.controller";


declare module "fastify" {
	interface FastifyInstance {
		authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
	}
} 


const server = fastify();

server.register(cors, {
	origin: "http://localhost:3000",
	credentials: true,
});

server.register(fastifyCookie, {
	secret: "my-secret",
	parseOptions: {},
});
server.register(fastifyFormbody);
server.register(fastifyMultipart, {
	limits: {
		fileSize: 5 * 1024 * 1024,
	},
});
server.register(fastifyJwt, {
	secret: process.env.JWT_SECRET || "supersecret",
});

server.register(fastifyStatic, {
	root: path.join(__dirname, "../public/images"),
	prefix: "/images/",
});

server.decorate("authenticate", async (req: FastifyRequest, reply: FastifyReply) => {
	try {
		await authMe(req, reply);
	} catch (err) {
		reply.status(401).send({ error: "Unauthorized" });
		console.error(err);
	}
});

server.register(authRoutes, { prefix: "/auth" });
server.register(userRoutes, { prefix: "/user" });

server.listen({ port: 5000, host: "0.0.0.0" }, (err, address) => {
	if (err) {
		console.error(err);
		process.exit(1);
	}
	console.log(`🚀 Server listening at ${address}`);
});