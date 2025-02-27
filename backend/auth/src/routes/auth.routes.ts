import { FastifyInstance } from "fastify";
import { login, verify2FA, googleAuth, logout } from "../controllers/auth.controller";

export default async function authRoutes(fastify: FastifyInstance) {
	fastify.post("/login", login);
	fastify.post("/verify-2fa", verify2FA);
	fastify.post("/google-authenticator", googleAuth);
	fastify.post("/logout", logout);
}
