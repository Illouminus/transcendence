import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import fastifyCookie from "@fastify/cookie";
import { FastifyReply, FastifyRequest } from "fastify";

export default fp(async (fastify) => {
	fastify.register(fastifyJwt, { secret: process.env.JWT_SECRET || "supersecret" });

	fastify.decorate("authenticate", async (req: FastifyRequest, res: FastifyReply) => {
		try {
			await req.jwtVerify();
		} catch (err) {
			res.status(401).send({ error: "Unauthorized" });
		}
	});
});