import { getConversationId, createConversation, getMessagesBetweenUsers,  saveMessage,  getUserConversations, removeMessageById } from "../models/chat.model";
  
  import { createNotFoundError, createDatabaseError, logError } from "../utils/errorHandler";
  
  // Service pour récupérer les messages entre deux utilisateurs
  export async function getMessagesService(user1: number) {
    try {
      const messages = await getMessagesBetweenUsers(user1);
      if (!messages) {
        throw createNotFoundError("Messages");
      }
      return messages;
    } catch (error) {
      logError(error, "getMessagesService");
      throw createDatabaseError("Failed to fetch messages", { user1 });
    }
  }
  
  function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Mois de 0 à 11
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
  
  // Service pour envoyer un message
  export async function sendMessageService(sender_id: number, receiver_id: number, content: string) {
    try {
      if (!sender_id || !receiver_id || !content) {
        throw createDatabaseError("All fields are required", { sender_id, receiver_id, content });
      }
  
      let conversation_id = await getConversationId(sender_id, receiver_id);
  
      if (conversation_id === null) {
        // Créer une nouvelle conversation si elle n'existe pas
        conversation_id = await createConversation(sender_id, receiver_id) as number;
      }
  
      if (!conversation_id) {
        throw createDatabaseError("Failed to create or retrieve conversation", { sender_id, receiver_id });
      }
  
      const now = new Date();
      const sent_at = formatDate(now);
      console.log(sent_at); // Exemple : 2025-04-10 09:16:09

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
  