import { FastifyReply, FastifyRequest } from "fastify";
import { 
  getMessagesService, 
  sendMessageService, 
  getConversationsService, 
  deleteMessageService 
} from "../services/chat.service";
import { getErrorMessage, getErrorStatusCode, logError } from "../utils/errorHandler";

// Récupérer les messages entre deux utilisateurs
export async function getMessagesController(req: FastifyRequest<{ Params: { user1: string, user2: string } }>, reply: FastifyReply) {
  try {
    const { user1, user2 } = req.params;
    // Vérification que les paramètres sont bien convertis en number
    const user1Id = parseInt(user1);
    const user2Id = parseInt(user2);
    
    if (isNaN(user1Id) || isNaN(user2Id)) {
      return reply.status(400).send({ error: "Invalid user IDs" });
    }

    const messages = await getMessagesService(user1Id, user2Id);
    return messages;
  } catch (error) {
    logError(error, "getMessagesController");
    return reply.status(getErrorStatusCode(error)).send({ error: getErrorMessage(error) });
  }
}


// Envoyer un message
export async function sendMessageController(req: FastifyRequest<{ Body: { senderId: number, receiverId: number, content: string } }>, reply: FastifyReply) {
  try {
    const { senderId, receiverId, content } = req.body;
    const newMessage = await sendMessageService(senderId, receiverId, content);
    return reply.status(201).send(newMessage);
  } catch (error) {
    logError(error, "sendMessageController");
    return reply.status(getErrorStatusCode(error)).send({ error: getErrorMessage(error) });
  }
}

// Récupérer toutes les conversations d'un utilisateur
export async function getConversationsController(req: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) {
  try {
    const { userId } = req.params;
    const conversations = await getConversationsService(parseInt(userId));
    return conversations;
  } catch (error) {
    logError(error, "getConversationsController");
    return reply.status(getErrorStatusCode(error)).send({ error: getErrorMessage(error) });
  }
}

// Supprimer un message par son ID
export async function deleteMessageController(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const { id } = req.params;
    await deleteMessageService(parseInt(id));
    return reply.status(200).send({ message: "Message deleted successfully" });
  } catch (error) {
    logError(error, "deleteMessageController");
    return reply.status(getErrorStatusCode(error)).send({ error: getErrorMessage(error) });
  }
}
