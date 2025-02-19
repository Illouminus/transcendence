import { FastifyInstance } from "fastify";
import { register, login, verify2FA } from "../controllers/auth.controller";

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post("/register", register);
  fastify.post("/login", login);
  fastify.post("/verify-2fa", verify2FA);
}
