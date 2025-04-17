import { Chat } from "./models/chat.model";
import { ChatArray } from "./chat";

export class ChatState {

    private static chat: Chat | null = null; // Chat actuel
    private static allChats: ChatArray[] = []; // Tableau pour stocker tous les messages

    // Ajouter un message au tableau
    public static addMessage(chat: ChatArray): void {
        this.allChats.push(chat);
    }

    // Récupérer les messages pour un utilisateur donné
    public static getMessagesForUser(userId: number): ChatArray[] {
        return this.allChats.filter(chat => chat.toUserId === userId.toString() || chat.fromUserId === userId);
    }

    // Vider les messages pour un utilisateur donné après envoi
    public static clearMessagesForUser(userId: number): void {
        this.allChats = this.allChats.filter(chat => chat.toUserId !== userId.toString() && chat.fromUserId !== userId);
    }
}
