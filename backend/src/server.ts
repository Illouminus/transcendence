import fastify from 'fastify';
import fastifyCookie from "@fastify/cookie";
import fastifyFormbody from "@fastify/formbody";
import fastifyJson from "@fastify/express";
import authPlugin from './plugins/jwt.plugin';
import authRoutes from './routes/auth.routes';
import "./database";

const server = fastify();

server.register(fastifyCookie, {
	secret: "my-secret",
	parseOptions: {},
});
server.register(fastifyFormbody);
server.register(fastifyJson);

server.register(authPlugin);
server.register(authRoutes, { prefix: "/auth" });

server.listen({ port: 8080, host: "0.0.0.0" }, (err, address) => {
	if (err) {
		console.error(err);
		process.exit(1);
	}
	console.log(`🚀 Server listening at ${address}`);
});