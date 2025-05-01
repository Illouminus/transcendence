import { Chat } from "./models/chat.model";
import { ChatArray } from "./chat";
import { loadUserProfileData } from "./users";
import { BASE_URL } from "./outils/config";

export class ChatState {

    private static chat: Chat | null = null; // Chat actuel
    private static allChats: ChatArray[] = []; // Tableau pour stocker tous les messages
    private static pendingChats: ChatArray[] = []; // Tableau pour stocker tous les messages à envoyer

    // Ajouter un message au tableau
    public static addMessage(chat: ChatArray): void {
        this.allChats.push(chat);
    }

    public static addPendingMessage(chat: ChatArray): void {
        this.pendingChats.push(chat);
    }

    public static getPendingMessagesForUsers(senderId: number, receiverId: number): ChatArray[] {
    return this.pendingChats.filter(
        chat =>
            (chat.fromUserId === senderId && chat.toUserId === receiverId) ||
            (chat.fromUserId === receiverId && chat.toUserId === senderId)
    );
}


    public static clearPendingMessages(): void {
        // Add all pending messages to allChats before clearing
        this.allChats = [...this.allChats, ...this.pendingChats];
        this.pendingChats = [];
    }
    // Récupérer les messages pour un utilisateur donné
    public static getMessagesForUser(userId: number): ChatArray[] {
        return this.allChats.filter(chat => chat.toUserId === userId || chat.fromUserId === userId);
    }

    // Vider les messages pour un utilisateur donné après envoi
    public static clearPendingMessagesForUsers(senderId: number, receiverId: number): void {
        this.pendingChats = this.pendingChats.filter(
            chat =>
                !((chat.fromUserId === senderId && chat.toUserId === receiverId) ||
                  (chat.fromUserId === receiverId && chat.toUserId === senderId))
        );
    }
    

    public static async fetchMessagesForUser(userId: number): Promise<void> {
        // Chargement des messages
        try {
            const response = await fetch(`${BASE_URL}/chat/messages/${userId}/`);
            if (!response.ok) throw new Error("Erreur lors de la récupération des messages");

            const messages = await response.json();
            ChatState.allChats = messages.map((message: any) => ({
                id: message.id,
                fromUserId: message.sender_id,
                toUserId: message.receiver_id,
                content: message.content,
                sent_at: message.sent_at,
            }));
        } catch (error) {
            console.error("Erreur de chargement des messages :", error);
        }
    }

    public static filterMessages(sender_id: number, receiver_id: number): ChatArray[] {
        // Vérifier si les IDs sont valides)
        if (isNaN(sender_id) || isNaN(receiver_id)) {
            console.error("Invalid user IDs");
            return [];
        }
        // Filtrer les messages
        // Vérifier si les messages existent
        if (this.allChats.length === 0) {
            console.error("No messages found");
            return [];
        }
        // Vérifier si les messages sont au format attendu
        if (!this.allChats.every(msg => msg.fromUserId && msg.toUserId)) {
            console.error("Invalid message format");
            return [];
        }
        
        // Filtrer les messages entre sender_id et receiver_id
        const filteredMessages = this.allChats.filter(msg => 
            ((msg.fromUserId === sender_id && receiver_id === msg.toUserId) ||
            (msg.fromUserId === receiver_id && sender_id === msg.toUserId))
        );
        return (filteredMessages);
    }

}
