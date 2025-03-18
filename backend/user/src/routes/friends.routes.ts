import {FastifyInstance} from 'fastify';
import { getFirendsListController, sendFriendRequestsController, getIncomingRequestsController,
    getOutgoingRequestsController,
} from '../controllers/friends.controller';

export default async function friendsRoutes(fastify: FastifyInstance) {

    fastify.get('/', getFirendsListController);
    fastify.post('/requests', sendFriendRequestsController);
    fastify.get('/requests/incoming', getIncomingRequestsController);
    fastify.get('/requests/outgoing', getOutgoingRequestsController);
    // fastify.post('/requests/:id/accept', acceptFriendRequestController);
    // fastify.post('/requests/:id/reject', rejectFriendRequestController);
    // fastify.delete('/:id/remove', removeFriendController);
    // fastify.post('/:id/block', blockFriendController);
    // fastify.delete('/:id/unblock', unblockFriendController);
    // fastify.post('/sendRequest', sendFriendRequestController);
}