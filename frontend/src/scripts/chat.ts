// async function sendMessage(meId: number, himID: number, messageText: string, himUsername: string, meUsername: string) {
//     if (!messageText || messageText.trim() === "") return;

//     try {
//         const chatSocket = UserState.getChatSocket();
//         if (chatSocket) {
//             chatSocket.send(JSON.stringify({
//                 type: "chat_send",
//                 payload: {
//                     username: himUsername,
//                     fromUserId: meId,
//                     toUserId: himID,
//                     text: messageText,
//                 },
//             }));
//         }

        

//         // const response = await fetch(`http://localhost:8084/chat/messages`, {
//         //     method: "POST",
//         //     headers: { "Content-Type": "application/json" },
//         //     body: JSON.stringify({
//         //         sender_id: meId,
//         //         receiver_id: himID,
//         //         content: messageText,
//         //     }),
//         // });
        
//         // if (!response.ok) throw new Error("Erreur lors de l'envoi du message");
        
//         displayMessage(himUsername, meUsername, meId, himID, messageText, new Date().toLocaleTimeString());
//     } catch (error) {
//         console.error("Erreur d'envoi du message :", error);
//     }
// }

import { UserState } from "./userState";
import { ChatState} from "./chatState";

export interface ChatArray {
    id: number;
    fromUserId: number;
    toUserId: string;
    content: string;
    sent_at: string;
}

// Fonction pour récupérer l'utilisateur courant et les utilisateurs
const getUserData = () => {
    const me = UserState.getUser();
    const allUsers = UserState.getAllUsers();
    return { me, allUsers };
};

// AFFICHAGE 
function toggleElementClass(elementId: string, className: string, add: boolean): void {
    const element = document.getElementById(elementId);
    if (element) {
        add ? element.classList.add(className) : element.classList.remove(className);
    }
}

// Utilitaire pour mettre à jour le contenu d'un élément
function updateElementContent(elementId: string, content: string): void {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = content;
    }
}

// Utilitaire pour ajouter un gestionnaire d'événements
function addEventListenerToElement(elementId: string, event: string, handler: EventListener): void {
    const element = document.getElementById(elementId);
    if (element) {
        element.replaceWith(element.cloneNode(true)); // Nettoyage des anciens listeners
        document.getElementById(elementId)?.addEventListener(event, handler);
    }
}

// Fonction pour envoyer un message
async function sendMessage(meId: number, himID: number, messageText: string): void {
    if (!messageText || messageText.trim() === "") return;

    const timestamp = new Date().toISOString(); // Horodatage

    // Affichage immédiat (pas d'envoi au backend ici)
    const { me, allUsers } = getUserData();
    const himUsername = allUsers.find(user => user.id === himID)?.username ?? "Utilisateur inconnu";
    const meUsername = me?.username ?? "Moi";

    try {
        // Envoi du message via WebSocket
        const chatSocket = UserState.getChatSocket();
        if (chatSocket) {
            chatSocket.send(JSON.stringify({
                type: "chat_send",
                payload: {
                    username: meUsername,
                    fromUserId: meId,
                    toUserId: himID,
                    text: messageText,
                },
            }));
        }

        // Ajout du message a l'Array pour le sauvegarder après
        const newMessage: ChatArray = {
            id: Date.now(), // Identifiant unique temporaire
            fromUserId: meId,
            toUserId: himID.toString(),
            content: messageText,
            sent_at: timestamp,
        };

        // Ajouter le message au tableau local
        ChatState.addMessage(newMessage);

            
        displayMessage(himUsername, meUsername, meId, himID, messageText, new Date().toLocaleTimeString());
    } catch (error) {
        console.error("Erreur d'envoi du message :", error);
    }
}

async function sendBufferedMessages(userId: number) {
    // Récupérer les messages pour l'utilisateur spécifié
    const bufferedMessages = ChatState.getMessagesForUser(userId);

    if (bufferedMessages.length === 0) {
        console.log("Aucun message à envoyer pour l'utilisateur :", userId);
        return;
    }

    try {
        // Construire le payload attendu par le contrôleur
        const payload = {
            messages: bufferedMessages.map(msg => ({
                sender_id: msg.fromUserId,
                receiver_id: parseInt(msg.toUserId), // Conversion en nombre si nécessaire
                content: msg.content,
            })),
        };

        const response = await fetch("http://localhost:8084/chat/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error("Erreur lors de l'envoi des messages au serveur.");
        }

        console.log("Messages envoyés avec succès pour l'utilisateur :", userId);

        // Une fois les messages envoyés, vider les messages pour cet utilisateur
        ChatState.clearMessagesForUser(userId);
    } catch (error) {
        console.error("Erreur lors de l'envoi des messages :", error);
    }
}


  


// Fonction de gestion de l'affichage des messages
function displayMessage(himUsername: string, meUsername: string, himId: number, senderId: number, content: string, time: string) {
    const chatMessagesContainer = document.getElementById("chatMessages");
    const messageContainer = document.createElement("div");
    messageContainer.classList.add("chatMessageSingle", "flex", "items-start", "mb-5", "w-full");
    messageContainer.setAttribute("data-user-id", senderId?.toString());

    const username = senderId === himId ? himUsername : meUsername;

    messageContainer.classList.add(senderId === himId ? "justify-start" : "justify-end");

    const messageHTML = `
        <div style="width: 70%" class="flex flex-col w-full leading-1.5 p-4 border-gray-200 bg-gray-100 rounded-xl dark:bg-gray-700">
            <div class="flex items-center space-x-2 rtl:space-x-reverse">
                <span class="text-sm font-semibold text-gray-900 dark:text-white">${username}</span>
                <span class="text-sm font-normal text-gray-500 dark:text-gray-400">${time}</span>
            </div>
            <p class="text-sm text-left py-2.5 text-gray-900 dark:text-white">${content}</p>
            <span class="text-sm text-right font-normal text-gray-500 dark:text-gray-400">Delivered</span>
        </div>
    `;

    messageContainer.innerHTML = messageHTML;
    chatMessagesContainer?.appendChild(messageContainer);

    if (chatMessagesContainer) {
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }
}

// Fonction pour créer la ligne de chat d'un utilisateur
function createChatUserRow(user: Friend): string {
    return `
        <div data-user-id="${user.friend_id}" class="chatConv flex items-center p-5 dark:hover:bg-gray-700 hover:cursor-pointer">
            <div class="relative flex-shrink-0 h-10 w-10">
                <img class="h-10 w-10 rounded-full object-cover" src=${`http://localhost:8080/user${user.friend_avatar}`} alt="">
            </div>
            <div class="ml-4">
                <div class="text-left text-sm font-medium text-gray-900 dark:text-white">${user.friend_username}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">${user.friend_email}</div>
            </div>
        </div>
    `;
}

async function openChatWindow(userId: string) {
    const { me, allUsers } = getUserData();
    const him = allUsers.find(user => user.id === parseInt(userId));
    const himUsername = him?.username ?? "Utilisateur inconnu";
    const himId = him?.id ?? 0;
    const meUsername = me?.username ?? "Utilisateur inconnu";
    const meId = me?.id ?? 0;

    // Mise à jour de l'affichage
    toggleElementClass('closeChat', 'hidden', true);
    toggleElementClass('goBack', 'hidden', false);
    toggleElementClass('chat-friends-list', 'hidden', true);
    toggleElementClass('chatInput', 'hidden', false);
    toggleElementClass('chatMessages', 'hidden', false);

    updateElementContent('chatTitle', himUsername);
    updateElementContent('chatMessages', "");

    // Gestion du bouton "Retour"
    addEventListenerToElement('goBack', 'click', () => hideChatMenu(true));

    // Chargement des messages
    try {
        const response = await fetch(`http://localhost:8084/chat/messages/${himId}/${meId}`);
        if (!response.ok) throw new Error("Erreur lors de la récupération des messages");

        const messages = await response.json();
        messages.forEach((message: any) => {
            displayMessage(himUsername, meUsername, himId, message.sender_id, message.content, message.sent_at);
        });
    } catch (error) {
        console.error("Erreur de chargement des messages :", error);
    }

    // Gestion de l'envoi des messages
    addEventListenerToElement("sendButton", "click", () => {
        const chatMessageInput = document.getElementById("chatMessage") as HTMLInputElement;
        if (chatMessageInput) {
            sendMessage(meId, himId, chatMessageInput.value);
            chatMessageInput.value = ''; // Effacement du champ après envoi
        }
    });
}


// Fonction pour initialiser les événements de chat
function attachChatEventListeners(): void {
    const chatConvs = document.querySelectorAll('.chatConv');
    chatConvs.forEach(chatConv => {
        chatConv.addEventListener('click', () => {
            const userId = chatConv.getAttribute('data-user-id');
            if (userId) openChatWindow(userId);
        });
    });
}

function hideChatMenu(isOpen: boolean): void {
    const { me, allUsers } = getUserData();
    const currentChatUser = document.getElementById("chatTitle")?.textContent;
    const him = allUsers.find(user => user.username === currentChatUser);

    if (isOpen && him) {
        // Envoi des messages non envoyés pour cet utilisateur
        sendBufferedMessages(him.id);
    }

    toggleElementClass('chatMessages', 'hidden', isOpen);
    toggleElementClass('chatInput', 'hidden', isOpen);
    toggleElementClass('chat-friends-list', 'hidden', false);

    updateElementContent('chatTitle', 'Chat');

    toggleElementClass('goBack', 'hidden', true);
    toggleElementClass('closeChat', 'hidden', false);
}



// Fonction pour afficher/masquer le menu de chat
function toggleChatMenu(isOpen: boolean): void {
    toggleElementClass('chatMenu', 'hidden', !isOpen);
}


type Friend = {
    friend_id: number;
    friend_username: string;
    friend_avatar: string;
    friend_email: string;
    status: string;
    online: boolean;
};

// Fonction d'initialisation du chat
export function chat(): void {
    const { me } = getUserData();
    const friends = me?.friends;

    // Gestion de l'affichage du chat menu (ouverture/fermeture)
    const chatButton = document.getElementById('chatButton');
    const closeChatButton = document.getElementById('closeChat');
    
    chatButton?.addEventListener('click', () => toggleChatMenu(true));
    closeChatButton?.addEventListener('click', () => toggleChatMenu(false));

    // Remplit le menu des utilisateurs
    const friendsListContainer = document.getElementById("chat-friends-list");
    friends?.forEach((friend) => {
        if (friend.friend_id !== UserState.getUser()?.id) {
            const userRow = createChatUserRow(friend);
            friendsListContainer?.insertAdjacentHTML('beforeend', userRow);
        }
    });

    // Ajoute des événements sur les utilisateurs
    attachChatEventListeners();
}
