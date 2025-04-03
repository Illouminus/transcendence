import { getMessagesBetweenUsers,  saveMessage,  getUserConversations, removeMessageById } from "../models/chat.model";
  
  import { createNotFoundError, createDatabaseError, logError } from "../utils/errorHandler";
  
  // Service pour récupérer les messages entre deux utilisateurs
  export async function getMessagesService(user1: number, user2: number) {
    try {
      const messages = await getMessagesBetweenUsers(user1, user2);
      if (!messages) {
        throw createNotFoundError("Messages");
      }
      return messages;
    } catch (error) {
      logError(error, "getMessagesService");
      throw createDatabaseError("Failed to fetch messages", { user1, user2 });
    }
  }
  
  // Service pour envoyer un message
  export async function sendMessageService(senderId: number, receiverId: number, content: string) {
    try {
      if (!senderId || !receiverId || !content) {
        throw createDatabaseError("All fields are required", { senderId, receiverId, content });
      }
  
      const newMessage = await saveMessage(senderId, receiverId, content);
      return newMessage;
    } catch (error) {
      logError(error, "sendMessageService");
      throw createDatabaseError("Failed to send message", { senderId, receiverId });
    }
  }
  
  // Service pour récupérer toutes les conversations d'un utilisateur
  export async function getConversationsService(userId: number) {
    try {
      const conversations = await getUserConversations(userId);
      return conversations;
    } catch (error) {
      logError(error, "getConversationsService");
      throw createDatabaseError("Failed to fetch conversations", { userId });
    }
  }
  
  // Service pour supprimer un message par son ID
  export async function deleteMessageService(messageId: number) {
    try {
      await removeMessageById(messageId);
    } catch (error) {
      logError(error, "deleteMessageService");
      throw createDatabaseError("Failed to delete message", { messageId });
    }
  }
  