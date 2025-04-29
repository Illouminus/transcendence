import { FastifyInstance } from "fastify";
import { gameStatisticsById, updateGameStatistics, getUserGames } from "../controllers/game.controller";

export async function gameRoutes(fastify: FastifyInstance) {
	fastify.get("/gameStats", gameStatisticsById);
	fastify.put("/gameStats/:id", updateGameStatistics);
	fastify.get("/userGames", getUserGames);
}

