import { UserArray } from "./users";
import { UserState } from "./userState";

// Fonction pour récupérer l'utilisateur courant et les utilisateurs
const getUserData = () => {
    const me = UserState.getUser();
    const allUsers = UserState.getAllUsers();
    return { me, allUsers };
};

// Fonction pour envoyer un message
async function sendMessage(meId: number, himID: number, messageText: string, himUsername: string, meUsername: string) {
    if (!messageText || messageText.trim() === "") return;

    try {
        const response = await fetch(`http://localhost:8084/chat/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                sender_id: meId,
                receiver_id: himID,
                content: messageText,
            }),
        });
        
        if (!response.ok) throw new Error("Erreur lors de l'envoi du message");
        
        // Optionnel : tu pourrais directement appeler displayMessage après l'envoi du message
        displayMessage(himUsername, meUsername, meId, himID, messageText, new Date().toLocaleTimeString());
    } catch (error) {
        console.error("Erreur d'envoi du message :", error);
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

    // ✅ SCROLL AUTOMATIQUE EN BAS
    if (chatMessagesContainer) {
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }
}


// Fonction pour créer la ligne de chat d'un utilisateur
function createChatUserRow(user: UserArray): string {
    return `
        <div data-user-id="${user.id}" class="chatConv flex items-center p-5 dark:hover:bg-gray-700 hover:cursor-pointer">
            <div class="flex-shrink-0 h-10 w-10">
                <img class="h-10 w-10 rounded-full object-cover" src=${`http://localhost:8080/user${user.avatar_url}`} alt="">
            </div>
            <div class="ml-4">
                <div class="text-left text-sm font-medium text-gray-900 dark:text-white">${user.username}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">${user.email}</div>
            </div>
        </div>
    `;
}

// Fonction pour ouvrir la fenêtre de chat
async function openChatWindow(userId: string) {
    const { me, allUsers } = getUserData();
    
    const him = allUsers.find(user => user.id === parseInt(userId));
    const himUsername = him ? him.username : "Utilisateur inconnu";
    const himId = him?.id ?? 0;
    const meUsername = me?.username ?? "Utilisateur inconnu";
    const meId = me?.id ?? 0;

    const friendsListContainer = document.getElementById("chat-friends-list");
    if (friendsListContainer) friendsListContainer.classList.add("hidden");

    const chatInput = document.getElementById("chatInput");
    if (chatInput) chatInput.classList.remove("hidden");

    const chatTitle = document.getElementById("chatTitle");
    if (chatTitle) chatTitle.innerHTML = himUsername;

    const chatMessagesContainer = document.getElementById("chatMessages");
    if (chatMessagesContainer) {
        chatMessagesContainer.innerHTML = "";
        chatMessagesContainer.classList.remove("hidden");
    }

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

    const sendButton = document.getElementById("sendButton");
    sendButton?.replaceWith(sendButton.cloneNode(true)); // reset l'event listener
    const newSendButton = document.getElementById("sendButton");

    newSendButton?.addEventListener("click", () => {
        const chatMessageInput = document.getElementById("chatMessage") as HTMLInputElement;
        if (chatMessageInput) {
            sendMessage(meId, himId, chatMessageInput.value, himUsername, meUsername);
            chatMessageInput.value = '';  // Clear the input after sending
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

// Fonction pour afficher/masquer le menu de chat
function toggleChatMenu(isOpen: boolean) {
    const chatMenu = document.getElementById('chatMenu');
    if (chatMenu) {
        if (isOpen) {
            chatMenu.classList.remove('hidden');
        } else {
            chatMenu.classList.add('hidden');
        }
    }
}

// Fonction d'initialisation du chat
export function chat(): void {
    const { allUsers } = getUserData();

    // Gestion de l'affichage du chat menu (ouverture/fermeture)
    const chatButton = document.getElementById('chatButton');
    const closeChatButton = document.getElementById('closeChat');
    
    chatButton?.addEventListener('click', () => toggleChatMenu(true));
    closeChatButton?.addEventListener('click', () => toggleChatMenu(false));

    // Remplit le menu des utilisateurs
    const friendsListContainer = document.getElementById("chat-friends-list");
    allUsers.forEach((user: UserArray) => {
        if (user.id !== UserState.getUser()?.id) {
            const userRow = createChatUserRow(user);
            friendsListContainer?.insertAdjacentHTML('beforeend', userRow);
        }
    });

    // Ajoute des événements sur les utilisateurs
    attachChatEventListeners();
}
