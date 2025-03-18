import { FastifyRequest, FastifyReply } from 'fastify';
import { getUserIdFromHeader } from '../utils/outils';
import { getErrorMessage, getErrorStatusCode } from '../utils/errorHandler';
import { getFriendsListService, sendFriendRequestService, getIncomingRequestsService,
    getOutgoingRequestsService, acceptFriendRequestService, rejectFriendRequestService,
    blockFriendService, unblockFriendService
 } from '../services/friends.service';

export async function getFirendsListController(request: FastifyRequest, reply: FastifyReply) {
    try {
        const userId = getUserIdFromHeader(request);
        const friendsList = await getFriendsListService(userId);
        reply.code(200).send(friendsList);
    } catch (error) {
        reply.code(getErrorStatusCode(error)).send(getErrorMessage(error));
    }
}


export async function sendFriendRequestsController(request: FastifyRequest<{Body: {userId: number}}>, reply: FastifyReply) {
    try {
        const userId = getUserIdFromHeader(request);
        const friendId = request.body.userId;

        const response = await sendFriendRequestService(userId, friendId);
        reply.code(200).send(response);
    } catch (error) {
        reply.code(getErrorStatusCode(error)).send(getErrorMessage(error));
    }
}


export async function getIncomingRequestsController(request: FastifyRequest, reply: FastifyReply) {
    try {
        const userId = getUserIdFromHeader(request);
        const incomingRequests = await getIncomingRequestsService(userId);
        reply.code(200).send(incomingRequests);
    } catch (error) {
        reply.code(getErrorStatusCode(error)).send(getErrorMessage(error));
    }
}


export async function getOutgoingRequestsController(request: FastifyRequest, reply: FastifyReply) {
    try {
        const userId = getUserIdFromHeader(request);
        const outgoingRequests = await getOutgoingRequestsService(userId);
        reply.code(200).send(outgoingRequests);
    } catch (error) {
        reply.code(getErrorStatusCode(error)).send(getErrorMessage(error));
    }
}


export async function acceptFriendRequestController(request: FastifyRequest<{Params: {id: number}}>, reply: FastifyReply) {
    try {
        const userId = getUserIdFromHeader(request);
        const friendId = request.params.id;

        const response = await acceptFriendRequestService(userId, friendId);
        reply.code(200).send(response);
    } catch (error) {
        reply.code(getErrorStatusCode(error)).send(getErrorMessage(error));
    }
}


export async function rejectFriendRequestController(request: FastifyRequest<{Params: {id: number}}>, reply: FastifyReply) {
    try {
        const userId = getUserIdFromHeader(request);
        const friendId = request.params.id;

        const response = await rejectFriendRequestService(userId, friendId);
        reply.code(200).send(response);
    } catch (error) {
        reply.code(getErrorStatusCode(error)).send(getErrorMessage(error));
    }
}

export async function blockFriendController(request: FastifyRequest<{Params: {id: number}}>, reply: FastifyReply) {
    try {
        const userId = getUserIdFromHeader(request);
        const friendId = request.params.id;

        const response = await blockFriendService(userId, friendId);
        reply.code(200).send(response);
    } catch (error) {
        reply.code(getErrorStatusCode(error)).send(getErrorMessage(error));
    }
}


export async function unblockFriendController(request: FastifyRequest<{Params: {id: number}}>, reply: FastifyReply) {
    try {
        const userId = getUserIdFromHeader(request);
        const friendId = request.params.id;

        const response = await unblockFriendService(userId, friendId);
        reply.code(200).send(response);
    } catch (error) {
        reply.code(getErrorStatusCode(error)).send(getErrorMessage(error));
    }
}