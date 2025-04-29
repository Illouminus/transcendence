import { FastifyReply, FastifyRequest } from "fastify";
import { 
  getMessagesService, 
  sendMessageService, 
  getConversationsService, 
  deleteMessageService 
} from "../services/chat.service";
import { sendNotification } from "../server";
import { getErrorMessage, getErrorStatusCode, logError } from "../utils/errorHandler";

// Récupérer les messages entre deux utilisateurs
export async function getMessagesController(req: FastifyRequest<{ Params: { user1: string } }>, reply: FastifyReply) {
  try {
    const { user1 } = req.params;
    // Vérification que les paramètres sont bien convertis en number
    const user1Id = parseInt(user1);
    
    if (isNaN(user1Id)) {
      return reply.status(400).send({ error: "Invalid user IDs" });
    }

    const messages = await getMessagesService(user1Id);
    return messages;
  } catch (error) {
    logError(error, "getMessagesController");
    return reply.status(getErrorStatusCode(error)).send({ error: getErrorMessage(error) });
  }
}

export async function sendSingleMessage(
  sender_id: number,
  receiver_id: number,
  content: string
) {
  try {
    console.log("Message to send:", { sender_id, receiver_id, content });

    if (!sender_id || !receiver_id || !content) {
      throw new Error("All fields (sender_id, receiver_id, content) are required.");
    }

    const savedMessage = await sendMessageService(sender_id, receiver_id, content);
    console.log("Message saved successfully:", savedMessage);
    return savedMessage;
  } catch (error) {
    logError(error, "sendSingleMessage");
    throw error;
  }
}

// Envoyer plusieurs messages
export async function sendMessagesController(
  req: FastifyRequest<{ Body: { messages: { sender_id: number, receiver_id: number, content: string }[] } }>, 
  reply: FastifyReply
) {
  try {
    const { messages } = req.body;
    console.log("Messages to send:", messages);

    if (!Array.isArray(messages) || messages.length === 0) {
      return reply.status(400).send({ error: "The messages array is required and cannot be empty." });
    }

    // Vérification que tous les messages contiennent les champs requis
    const invalidMessage = messages.find(msg => !msg.sender_id || !msg.receiver_id || !msg.content);
    if (invalidMessage) {
      return reply.status(400).send({ error: "All fields are required for each message." });
    }

    // Appeler le service pour sauvegarder les messages
    const savedMessages = await Promise.all(
      messages.map(msg => sendMessageService(msg.sender_id, msg.receiver_id, msg.content))
    );

    return reply.status(201).send(savedMessages);
  } catch (error) {
    logError(error, "sendMessagesController");
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
