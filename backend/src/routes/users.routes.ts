import { FastifyInstance } from "fastify";
import { registerUser, updateProfile } from "../controllers/users.controller";

export default async function userRoutes(fastify: FastifyInstance) {
	fastify.put("/update", { preHandler: fastify.authenticate }, updateProfile);
	fastify.post("/register", registerUser);
}
