import { FastifyInstance } from "fastify";
import { gameStatisticsById, getUserGames } from "../controllers/game.controller";

export async function gameRoutes(fastify: FastifyInstance) {
	fastify.get("/gameStats", gameStatisticsById);
	fastify.get("/userGames", getUserGames);
}

