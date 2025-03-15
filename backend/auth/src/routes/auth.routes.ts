import { FastifyInstance } from "fastify";
import { loginController, verify2FAController, googleAuthLogin, 
	logoutController, updateController, registerController, verifyEmailController } from "../controllers/auth.controller";

export default async function authRoutes(fastify: FastifyInstance) {
	fastify.post("/login", loginController);
	fastify.post("/verify-2fa", verify2FAController);
	fastify.post("/google-authenticator", googleAuthLogin);
	fastify.get("/logout", logoutController);
	fastify.post("/update", updateController);
	fastify.post("/register", registerController);
	fastify.get("/verify", verifyEmailController);
}
