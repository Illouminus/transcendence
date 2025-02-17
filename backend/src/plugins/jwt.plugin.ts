import fp from "fastify-plugin";
import { FastifyReply, FastifyRequest } from "fastify";

export default fp(async (fastify) => {

	fastify.decorate("authenticate", async (req: FastifyRequest, res: FastifyReply) => {
		try {
			await req.jwtVerify();
		} catch (err) {
			res.status(401).send({ error: "Unauthorized" });
		}
	});
});