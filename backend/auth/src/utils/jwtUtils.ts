import { FastifyInstance, FastifyRequest } from "fastify";
import { JwtPayload } from "../@types/auth.types";

export async function getUserIdFromJWT(fastify: FastifyInstance, req: FastifyRequest): Promise< number| null> {
	try {
		const token = req.cookies.token;
		if (!token) {
			return null;
		}
		let decoded: JwtPayload | null;
		try {
			decoded = await fastify.jwt.decode(token);
		} catch (err) {
			return null;
		}
		if (!decoded || typeof decoded !== "object" || !decoded.userId) {
			return null;
		}
		return decoded.userId as number;
	} catch (error) {
		return null;
	}
}
