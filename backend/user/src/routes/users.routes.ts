import { FastifyInstance } from "fastify";
import { updateAvatarController } from "../controllers/users.controller";

export default async function userRoutes(fastify: FastifyInstance) {
	fastify.put("/updatePhoto", updateAvatarController);
}
