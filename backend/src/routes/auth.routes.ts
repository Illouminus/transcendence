import { FastifyInstance } from "fastify";
import { register, login } from "../controllers/auth.controller";

export default async function authRoutes(fastify: FastifyInstance) {
	fastify.post("/register", register);
	fastify.post("/login", login);
}