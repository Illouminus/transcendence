import { FastifyInstance } from "fastify";
import { loginController, verify2FAController, googleAuthLogin, 
	logoutController, updateController } from "../controllers/auth.controller";

export default async function authRoutes(fastify: FastifyInstance) {
	fastify.post("/login", loginController);
	fastify.post("/verify-2fa", verify2FAController);
	fastify.post("/google-authenticator", googleAuthLogin);
	fastify.post("/logout", logoutController);
	fastify.post("/update", updateController);
}
