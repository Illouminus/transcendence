import { FastifyRequest, FastifyReply } from 'fastify';
import { getGameStatisticsByIdService } from '../services/game.service';

export async function gameStatisticsById(request: FastifyRequest, reply: FastifyReply) {
    try {
        const userIdHeader = request.headers['x-user-id'];
		if (!userIdHeader) {
		  throw new Error("UserID have to be provided")
		}
		const userId = parseInt(userIdHeader as string, 10);
        const user = await getGameStatisticsByIdService(userId);
        reply.send(user);
        
    } catch (error) {
        reply.status(404).send("User not found")
    }

}


export async function updateGameStatistics(request: FastifyRequest, reply: FastifyReply) {

    try {
        
    } catch (error) {
        
    }

}