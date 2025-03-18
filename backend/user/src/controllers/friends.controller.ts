import { FastifyRequest, FastifyReply } from 'fastify';
import { getUserIdFromHeader } from '../utils/outils';
import { getErrorMessage, getErrorStatusCode } from '../utils/errorHandler';
import { getFriendsListService } from '../services/friends.service';

export async function getFirendsListController(request: FastifyRequest, reply: FastifyReply) {
    try {
        const userId = getUserIdFromHeader(request);
        const friendsList = await getFriendsListService(userId);
        console.log(friendsList);
        reply.code(200).send(friendsList);
    } catch (error) {
        reply.code(getErrorStatusCode(error)).send(getErrorMessage(error));
    }
}