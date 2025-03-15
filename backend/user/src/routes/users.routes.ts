import { FastifyInstance } from "fastify";
import { updateAvatarController, getUserInfoController } from "../controllers/users.controller";

export default async function userRoutes(fastify: FastifyInstance) {
	fastify.post("/updatePhoto", updateAvatarController);
	fastify.get("/getUserInfo", getUserInfoController);
	fastify.get("/me", getUserInfoController);
}

