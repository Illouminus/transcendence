import { fetchUserProfile } from "./services/user.service";
import { UserArray } from "./users";

let userId: number | null = null;
let username: string | null = null;
let avatar: string | null = null;

// Récupérer l'ID utilisateur au chargement
fetchUserProfile().then(user => {
  if (user) {
    userId = user.id;
    username = user.username;
    avatar = user.avatar || null;
  }
});

export function openChat(user: UserArray): void {
    const chatScroll = document.getElementById('chatScroll');
    const chatInput = document.getElementById('chatInput');

    if (!chatScroll || !chatInput) {
        console.error('Chat elements not found');
        return;
    }

    // Met à jour l'en-tête ou d'autres éléments si nécessaire
    console.log(`Chat with user: ${user.username}`);

    // Montre la zone de chat
    chatScroll.innerHTML = ''; // Réinitialise les messages précédents
    chatInput.classList.remove('hidden');
}



function chat(): void {
    console.log(username); 
    const chatMessageInput = document.getElementById("chatMessage");
    const sendButton = document.getElementById("sendButton");
    const chatMenu = document.getElementById("chatScroll");
  
    sendButton?.addEventListener("click", function () {
      const messageText = chatMessageInput?.value; 
      console.log(messageText);
  
        if (messageText === "") return; // Ne rien faire si le message est vide
  
        // Crée un nouvel élément de message
        const messageContainer = document.createElement("div");
        messageContainer.classList.add("flex", "items-start", "mb-5", "w-full");
  
        const messageHTML = `
        <img class="w-8 h-8 rounded-full" src="http://localhost:8080/user${avatar}" alt="User image">
        <div class="flex flex-col w-full leading-1.5 p-4 border-gray-200 bg-gray-100 rounded-e-xl rounded-es-xl dark:bg-gray-700">
            <div class="flex items-center space-x-2 rtl:space-x-reverse">
                <span class="text-sm font-semibold text-gray-900 dark:text-white">${username}</span>
                <span class="text-sm font-normal text-gray-500 dark:text-gray-400">11:46</span>
            </div>
            <p class="text-sm text-left  py-2.5 text-gray-900 dark:text-white">${messageText}</p>
            <span class="text-sm text-right font-normal text-gray-500 dark:text-gray-400">Delivered</span>
        </div>
        `;
        messageContainer.innerHTML = messageHTML;
        console.log(messageContainer.innerHTML);
        chatMenu?.insertBefore(messageContainer, chatMenu.querySelector(".grow"));
  
        // Réinitialise le champ d'entrée
        if (chatMessageInput)
          chatMessageInput.innerHTML = "";
    });
  }