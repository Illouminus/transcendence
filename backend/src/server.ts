import fastify from "fastify";
import fastifyCookie from "@fastify/cookie";
import fastifyFormbody from "@fastify/formbody";
import cors from '@fastify/cors'
import fastifyStatic from "@fastify/static";
import fastifyJwt from "@fastify/jwt";
import authPlugin from "./plugins/jwt.plugin";
import authRoutes from "./routes/auth.routes";
import path from "path";
import "./database";

const server = fastify();


server.register(cors, {
	origin: "http://localhost:3000",
	credentials: true
})

server.register(fastifyCookie, {
	secret: "my-secret",
	parseOptions: {},
});
server.register(fastifyFormbody);
server.register(fastifyJwt, {
	secret: process.env.JWT_SECRET || "supersecret",
});

server.register(fastifyStatic, {
	root: path.join(__dirname, "../frontend/build"),

});


server.register(authPlugin);
server.register(authRoutes, { prefix: "/auth" });

server.listen({ port: 5000, host: "0.0.0.0" }, (err, address) => {
	if (err) {
		console.error(err);
		process.exit(1);
	}
	console.log(`🚀 Server listening at ${address}`);
});
