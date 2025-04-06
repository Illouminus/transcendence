import { c } from "vite/dist/node/moduleRunnerTransport.d-CXw_Ws6P";
import { UserArray } from "./users";
import { UserState } from "./userState";

function createChatUserRow(user: UserArray): string {

    return `
        <div data-user-id="${user.id}" class="chatConv flex items-center p-5 dark:hover:bg-gray-700 hover:cursor-pointer">
            <div class="flex-shrink-0 h-10 w-10">
                <img class="h-10 w-10 rounded-full object-cover" src=${`http://localhost:8080/user${user.avatar_url}`} alt="">
            </div>
            <div class="ml-4">
                <div class="text-left text-sm font-medium text-gray-900 dark:text-white">
                    ${user.username}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                    ${user.email}
                </div>
            </div>
        </div>
`;
}


function attachChatEventListeners(): void {
    const chatConvs = document.querySelectorAll('.chatConv'); // Sélectionne toutes les divs générées
    chatConvs.forEach(chatConv => {
        chatConv.addEventListener('click', () => {
            const userId = chatConv.getAttribute('data-user-id');
            if (userId) {
                openChatWindow(userId); // Appelez la fonction pour ouvrir le chat
            }
        });
    });
}


function openChatWindow(userId: string): void {
    // Cache l'ancienne liste de users
    const friendsListContainer = document.getElementById("chat-friends-list");
    if (friendsListContainer) {
        friendsListContainer.classList.add("hidden");
    }

    //Affiche l'input de message
    const chatInput = document.getElementById("chatInput");
    if (chatInput) {
        chatInput.classList.remove("hidden");
    }

    // Remplace le titre chat par le username cliqué
    const chatTitle = document.getElementById("chatTitle");
    if (chatTitle) {
        chatTitle.innerHTML = `${UserState.getAllUsers().find(u => u.id)?.username}`;
    }

}

export function chat(): void {

    const user = UserState.getUser();
    const username = user?.username;
    const avatar = user?.avatar;
    const chatButton = document.getElementById('chatButton')
    const closeChatButton = document.getElementById('closeChat');
    if (chatButton) {
        chatButton.addEventListener('click', function() {
			const chatMenu = document.getElementById('chatMenu');
            if (chatMenu) {
			    chatMenu.classList.remove('hidden');
            }
		});
    }
    if (closeChatButton) {
	    closeChatButton.addEventListener('click', function() {
			const chatMenu = document.getElementById('chatMenu');
            if (chatMenu) { 
			    chatMenu.classList.add('hidden');
            }
        });
    }

    // Remplit le menu des users
    const friendsListContainer = document.getElementById("chat-friends-list");
    const friendsList = UserState.getAllUsers();
    friendsList.forEach((user: UserArray) => {
        if (user.id !== UserState.getUser()?.id) {
            const userRow = createChatUserRow(user);
            if (friendsListContainer) {
                friendsListContainer.innerHTML += userRow;
            }
        }});

    // Ajoute des evenys listeners sur les users
    attachChatEventListeners();

    const chatMessagesContainer = document.getElementById("chatMessages");
    const chatMessageInput = document.getElementById("chatMessage");
    const sendButton = document.getElementById("sendButton");
  
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
        chatMessagesContainer?.insertBefore(messageContainer, chatMessagesContainer.querySelector(".grow"));
  
        // Réinitialise le champ d'entrée
        if (chatMessageInput)
          chatMessageInput.innerHTML = "";
    });
}