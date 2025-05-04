import { UserState } from "./userState";
import { ChatState } from "./chatState";
import { showAlert } from "./services/alert.service";
import { redirectTo } from "./router";
import { BASE_URL } from "./outils/config";
import { CreateScreenshotAsync } from "babylonjs";


export interface ChatArray {
    id: number;
    fromUserId: number;
    toUserId: number;
    content: string;
    sent_at: string;
}

// Variable pour suivre l'utilisateur de la fenêtre de chat ouverte
let openedChatWindow: boolean = false;

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

function toggleElementDisabled(elementId: string, disable: boolean): void {
    const element = document.getElementById(elementId) as HTMLInputElement | null;
    if (element) {
        element.disabled = disable;
    } else {
        console.error(`Element with id "${elementId}" not found.`);
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
async function sendMessage(meId: number, himID: number, messageText: string): Promise<void> {
    if (!messageText || messageText.trim() === "") return;

    const timestamp = new Date().toLocaleTimeString(); // Horodatage

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
                    sent_at: timestamp,
                },
            }));
        }

        displayMessage(meUsername, himUsername, meId, messageText, timestamp);
    } catch (error) {
        console.error("Erreur d'envoi du message :", error);
    }
}

async function sendBufferedMessages(userId: number) {
    ChatState.fetchMessagesForUser(userId);
}

const chatInviteToGame = async (friendId: number) => {
    try {
        const gameSocket = UserState.getGameSocket();
        if (!gameSocket) {
            console.error('Game socket not available');
            showAlert('Game socket not available', 'danger');
            return;
        }
        gameSocket.send(JSON.stringify({ type: 'game_invite', payload: { friendId: friendId } }));
    } catch (error) {
        console.error('Error inviting to game:', error);
        showAlert('Failed to send game invitation', 'danger');
    }
};


// Fonction de gestion de l'affichage des messages
export function displayMessage(user1: string, user2: string, fromUserId: number, content: string, sent_at: string): void {
    const { me } = getUserData();
    const meId = me?.id ?? 0;
    const chatMessagesContainer = document.getElementById("chatMessages");
    if (!chatMessagesContainer) return;

    const messageContainer = document.createElement("div");
    messageContainer.classList.add("flex", "items-start", "mb-4", "w-full");
    messageContainer.setAttribute("data-user-id", fromUserId?.toString());

    const isMe = fromUserId === meId;
    messageContainer.classList.add(isMe ? "justify-end" : "justify-start");

    const messageHTML = `
        <div class="flex flex-col max-w-[80%] ${isMe ? 'items-end' : 'items-start'}">
            <div class="flex items-center space-x-2 mb-1">
                <span class="text-xs font-medium text-gray-400">${isMe ? user1 : user2}</span>
                <span class="text-xs text-gray-500">${sent_at}</span>
            </div>
            <div class="flex ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2">
                <div class="${isMe ? 'bg-blue-600' : 'bg-gray-700'} text-white px-4 py-2 rounded-2xl ${isMe ? 'rounded-tr-none' : 'rounded-tl-none'}">
                    <p class="text-sm">${content}</p>
                </div>
            </div>
        </div>
    `;

    messageContainer.innerHTML = messageHTML;
    chatMessagesContainer.appendChild(messageContainer);
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
}

// Fonction pour créer la ligne de chat d'un utilisateur
function createChatUserRow(user: Friend): string {

    return `
        <div data-user-id="${user.friend_id}" class="chatConv flex items-center p-5 dark:hover:bg-gray-700 hover:cursor-pointer">
            <div class="relative flex-shrink-0 h-10 w-10">
                <img class="h-10 w-10 rounded-full object-cover" src=${`${BASE_URL}/user${user.friend_avatar}`} alt="">
                <span class="absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white dark:ring-gray-800 ${user.online ? 'bg-green-500' : 'bg-yellow-500'}"></span>
            </div>
            <div class="ml-4">
                <div class="text-left text-sm font-medium text-gray-900 dark:text-white">${user.friend_username}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">${user.friend_email}</div>
            </div>
        </div>
    `;
}

export function updateChatUserRowStatus(userId: number, online: boolean) {
    // Trouver l'élément correspondant dans le DOM
    const userRow = document.querySelector(`[data-user-id="${userId}"]`);
    if (userRow) {
        const statusIndicator = userRow.querySelector('span');

        if (statusIndicator) {
            // Supprimer les classes existantes et ajouter la bonne classe
            statusIndicator.classList.remove('bg-green-500', 'bg-yellow-500');
            statusIndicator.classList.add(online ? 'bg-green-500' : 'bg-yellow-500');
        }
    }
}

async function openChatWindow(userId: string) {
    openedChatWindow = true;
    const { me } = getUserData();
    const friends = me?.friends;
    const him = friends?.find(user => user.friend_id === parseInt(userId));
    const himUsername = him?.friend_username ?? "Utilisateur inconnu";
    const himId = him?.friend_id ?? 0;
    const meUsername = me?.username ?? "Utilisateur inconnu";
    const meId = me?.id ?? 0;


    const chatInput = document.getElementById("chatInput");
    if (him?.status != 'blocked')
        chatInput?.classList.remove("hidden");

    if (him?.status === 'blocked') {
        showAlert(`${himUsername} is blocked, cannot send messages.`, 'warning');
        toggleElementClass('chatInput', 'hidden', true);
    }
    else if (!him?.online) {
        showAlert(`${himUsername} is not online, cannot send messages.`, 'warning');
        toggleElementClass('chatInput', 'hidden', true);
    }

    // Mise à jour de l'affichage
    toggleElementClass('closeChat', 'hidden', true);
    toggleElementClass('goBack', 'hidden', false);
    toggleElementClass('chat-friends-list', 'hidden', true);
    toggleElementClass('chatMessages', 'hidden', false);
    const chatSubContainer = document.getElementById("chatSubContainer");
    if (chatSubContainer) {
        chatSubContainer.classList.remove("justify-start");
        chatSubContainer.classList.add("justify-end");
    }
    updateElementContent('chatTitle', himUsername);
    updateElementContent('chatMessages', "");

    // Gestion du bouton "Retour"
    addEventListenerToElement('goBack', 'click', () => hideChatMenu(true));

    // Gestion du bouton "Invite to Game"
    addEventListenerToElement('chatInviteGameButton', 'click', () => {
        chatInviteToGame(himId);
        toggleChatMenu(false);
    });

    // Gestion du bouton "Profile"
    addEventListenerToElement('chatTitle', 'click', () => {
        redirectTo(`/user-profile?id=${himId}`);
    });

    await ChatState.fetchMessagesForUser(meId); 
    const messages = ChatState.filterMessages(meId, himId);
    messages.forEach(message => {
        displayMessage(meUsername, himUsername, message.fromUserId, message.content, message.sent_at);
    });


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
    const meId = me?.id ?? 0;
    const currentChatUser = document.getElementById("chatTitle")?.textContent;
    const him = allUsers.find(user => user.username === currentChatUser);

    if (isOpen && him) {
        // Envoi des messages non envoyés pour cet utilisateur
        sendBufferedMessages(meId);
    }

    const chatSubContainer = document.getElementById("chatSubContainer");
    if (chatSubContainer) {
        chatSubContainer.classList.remove("justify-end");
        chatSubContainer.classList.add("justify-start");
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
    

    // Éléments du DOM
    const chatButton = document.getElementById('chatButton');
    const closeChatButton = document.getElementById('closeChat');
    const friendsListContainer = document.getElementById("chat-friends-list");

    if (!chatButton || !closeChatButton || !friendsListContainer) {
        console.error("Éléments du DOM manquants pour initialiser le chat.");
        return;
    }

    // Ajout des événements sur les boutons
    chatButton?.addEventListener('click', () => toggleChatMenu(true));
    closeChatButton?.addEventListener('click', () => {
        toggleChatMenu(false);
    });


    friends?.forEach((friend) => {
        if (friend.friend_id !== UserState.getUser()?.id) {
            // Vérifier si l'utilisateur est déjà dans la liste
            const existingUserRow = friendsListContainer?.querySelector(`[data-user-id="${friend.friend_id}"]`);
            
            if (!existingUserRow) {
                const userRow = createChatUserRow(friend);
                friendsListContainer?.insertAdjacentHTML('beforeend', userRow);
            }
        }
    });
    

    // Ajoute des événements sur les utilisateurs
    attachChatEventListeners();
}
