import { getConversationId, createConversation, getMessagesBetweenUsers,  saveMessage,  getUserConversations, removeMessageById } from "../models/chat.model";
  
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
  export async function sendMessageService(sender_id: number, receiver_id: number, content: string) {
    try {
      if (!sender_id || !receiver_id || !content) {
        throw createDatabaseError("All fields are required", { sender_id, receiver_id, content });
      }
  
      let conversation_id = await getConversationId(sender_id, receiver_id);
      console.log('Conversation ID' + conversation_id);
  
      if (conversation_id === null) {
        // Créer une nouvelle conversation si elle n'existe pas
        conversation_id = await createConversation(sender_id, receiver_id) as number;
      }
  
      if (!conversation_id) {
        throw createDatabaseError("Failed to create or retrieve conversation", { sender_id, receiver_id });
      }
  
      const sent_at = new Date().toISOString();
      const newMessage = await saveMessage(conversation_id, sender_id, receiver_id, content, sent_at);
  
      return newMessage;
    } catch (error) {
      logError(error, "sendMessageService");
      throw createDatabaseError("Failed to send message", { sender_id, receiver_id });
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
  