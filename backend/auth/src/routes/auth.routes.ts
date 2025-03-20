import { FastifyInstance } from "fastify";
import { loginController, googleAuthLogin, 
	logoutController, updateController, 
	registerController, verifyEmailController, getUserInfoController,
	} from "../controllers/auth.controller";
import { enable2FAController, disable2FAController, verify2FAController } from "../controllers/2fa.controller";

export default async function authRoutes(fastify: FastifyInstance) {
	fastify.post("/login", loginController);
	fastify.post("/verify-2fa", verify2FAController); 
	fastify.get("/enable-2fa", enable2FAController);
	fastify.get("/disable-2fa", disable2FAController);
	fastify.post("/google-authenticator", googleAuthLogin);
	fastify.get("/logout", logoutController);
	fastify.post("/update", updateController);
	fastify.post("/register", registerController);
	fastify.get("/verify", verifyEmailController);
	fastify.get("/me", getUserInfoController);
}