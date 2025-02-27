import { FastifyInstance } from "fastify";
import { updateProfile } from "../controllers/users.controller";

export default async function userRoutes(fastify: FastifyInstance) {
	fastify.put("/update", updateProfile);
}
