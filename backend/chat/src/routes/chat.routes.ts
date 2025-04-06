import { FastifyInstance } from "fastify";
import { getMessagesController, 
  sendMessageController, 
  getConversationsController, 
  deleteMessageController 
} from "../controllers/chat.controller";

export default async function chatRoutes(fastify: FastifyInstance) {
  fastify.get("/messages/:user1/:user2", getMessagesController);
  fastify.post("/messages", sendMessageController);
  fastify.get("/conversations/:userId", getConversationsController);
  fastify.delete("/messages/:id", deleteMessageController);
}
