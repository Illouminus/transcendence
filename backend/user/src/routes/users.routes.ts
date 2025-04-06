import { FastifyInstance } from "fastify";
import { updateAvatarController, getUserInfoController, getAllUsersController, incrementWinsController } from "../controllers/users.controller";

export default async function userRoutes(fastify: FastifyInstance) {
	fastify.post("/updatePhoto", updateAvatarController);
	fastify.get("/getUserInfo", getUserInfoController);
	fastify.get("/me", getUserInfoController);
	fastify.get("/getAllUsers", getAllUsersController);
	fastify.post("/incrementWins", incrementWinsController);
	//fastify.get("/getUserById", getUserByIdController);	
}

