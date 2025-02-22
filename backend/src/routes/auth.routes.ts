import { FastifyInstance } from "fastify";
import { register, login, verify2FA, googleAuth, authMe, logout } from "../controllers/auth.controller";

export default async function authRoutes(fastify: FastifyInstance) {
	fastify.post("/register", register);
	fastify.post("/login", login);
	fastify.post("/verify-2fa", verify2FA);
	fastify.post("/google-authenticator", googleAuth);
	fastify.get("/me", authMe);
	fastify.post("/logout", logout);
}
