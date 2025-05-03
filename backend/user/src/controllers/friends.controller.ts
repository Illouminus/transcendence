import { FastifyRequest, FastifyReply } from 'fastify';
import { getUserIdFromHeader } from '../utils/outils';
import { getErrorMessage, getErrorStatusCode } from '../utils/errorHandler';
import { getFriendsListService, sendFriendRequestService, getIncomingRequestsService,
    getOutgoingRequestsService, acceptFriendRequestService, rejectFriendRequestService,
    blockFriendService, unblockFriendService, deleteFriendService
 } from '../services/friends.service';
import { activeConnections, sendNotification } from '../server';
import { getUserById } from '../models/user.model';

export async function getFirendsListController( request: FastifyRequest, reply: FastifyReply) {
    try {
        const userId = getUserIdFromHeader(request);
        const friendsList = await getFriendsListService(userId);
        reply.code(200).send(friendsList);
    } catch (error) {
        reply.code(getErrorStatusCode(error)).send({error: getErrorMessage(error)});
    }
}



export async function sendFriendRequestsController(request: FastifyRequest<{Body: {userId: number}}>, reply: FastifyReply) {
    try {
        const userId = getUserIdFromHeader(request);
        const friendId = request.body.userId;

        const response = await sendFriendRequestService(userId, friendId);
        const user = await getUserById(userId);
        sendNotification(friendId, {type: 'incoming_request', payload: {message: 'You have a new friend request', user: user}});
        reply.code(200).send({message: response});
    } catch (error) {
        reply.code(getErrorStatusCode(error)).send({error: getErrorMessage(error)});
    }
}


export async function getIncomingRequestsController(request: FastifyRequest, reply: FastifyReply) {
    try {
        const userId = getUserIdFromHeader(request);
        const incomingRequests = await getIncomingRequestsService(userId);
        reply.code(200).send(incomingRequests);
    } catch (error) {
        reply.code(getErrorStatusCode(error)).send({error: getErrorMessage(error)});
    }
}


export async function getOutgoingRequestsController(request: FastifyRequest, reply: FastifyReply) {
    try {
        const userId = getUserIdFromHeader(request);
        const outgoingRequests = await getOutgoingRequestsService(userId);
        reply.code(200).send(outgoingRequests);
    } catch (error) {
        reply.code(getErrorStatusCode(error)).send({error: getErrorMessage(error)});
    }
}


export async function acceptFriendRequestController(request: FastifyRequest<{Params: {id: number}}>, reply: FastifyReply) {
    try {
        const userId = getUserIdFromHeader(request);
        const friendId = request.params.id;

        const response = await acceptFriendRequestService(userId, friendId);
        const user = await getUserById(userId);
        const isOnline = activeConnections.has(Number(friendId));
        sendNotification(Number(friendId), {type: 'friend_request_accepted', payload: {message: 'Your friend request has been accepted', user: user, isOnline: isOnline}});
        reply.code(200).send(response);
    } catch (error) {
        reply.code(getErrorStatusCode(error)).send({error: getErrorMessage(error)});
    }
}


export async function rejectFriendRequestController(request: FastifyRequest<{Params: {id: number}}>, reply: FastifyReply) {
    try {
        const userId = getUserIdFromHeader(request);
        const friendId = request.params.id;

        const response = await rejectFriendRequestService(userId, friendId);
        const user = await getUserById(userId);
        sendNotification(Number(friendId), {type: 'friend_request_rejected', payload: {message: 'Your friend request has been rejected', user: user}});
        reply.code(200).send(response);
    } catch (error) {
        reply.code(getErrorStatusCode(error)).send({error: getErrorMessage(error)});
    }
}

export async function blockFriendController(request: FastifyRequest<{Params: {id: number}}>, reply: FastifyReply) {
    try {
        const userId = getUserIdFromHeader(request);
        const friendId = request.params.id;

        const response = await blockFriendService(userId, friendId);
        const user = await getUserById(userId);

        
        sendNotification(Number(friendId), {type: 'friend_blocked', payload: {message: 'You have been blocked by a user', user: user}});

        reply.code(200).send(response);
    } catch (error) {
        reply.code(getErrorStatusCode(error)).send({error: getErrorMessage(error)});
    }
}


export async function unblockFriendController(request: FastifyRequest<{Params: {id: number}}>, reply: FastifyReply) {
    try {
        const userId = getUserIdFromHeader(request);
        const friendId = request.params.id;

        const response = await unblockFriendService(userId, friendId);
        const user = await getUserById(userId);
        const friend = await getUserById(friendId);
        if (!friend) {
            reply.code(404).send({error: 'Friend not found'});
            return;
        }
        
        // Check if the unblocked user is online using their auth_user_id
        const isOnline = activeConnections.has(friend.auth_user_id);
        
        sendNotification(Number(friendId), {
            type: 'friend_unblocked', 
            payload: {
                message: 'You have been unblocked by a user', 
                user: user, 
                isOnline: isOnline
            }
        });
        
        sendNotification(Number(userId), {
            type: 'unblocked_user', 
            payload: {
                message: 'You have unblocked a user', 
                user: friend,
                isOnline: isOnline
            }
        });
        reply.code(200).send(response);
    } catch (error) {
        reply.code(getErrorStatusCode(error)).send({error: getErrorMessage(error)});
    }
}

export async function deleteFriendController(request: FastifyRequest<{Params: {id: number}}>, reply: FastifyReply) {
    try {
        const userId = getUserIdFromHeader(request);
        const friendId = request.params.id;

        const response = await deleteFriendService(userId, friendId);
        const user = await getUserById(userId);
        sendNotification(Number(friendId), {type: 'friend_deleted', payload: {message: 'You have been deleted by a user', user: user}});
        reply.code(200).send(response);
    } catch (error) {
        reply.code(getErrorStatusCode(error)).send({error: getErrorMessage(error)});
    }
}

