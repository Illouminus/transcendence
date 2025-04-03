import { UserArray } from "./users";
import { UserState } from "./userState";



// function sendMessage(userId: string)
// {
//     const user = UserState.getUser();
//     const username = user?.username;
//     const avatar = user?.avatar;

//     const chatMessagesContainer = document.getElementById("chatMessages");
//     const chatMessageInput = document.getElementById("chatMessage");
//     const messageText = chatMessageInput?.value; 

//     // Ne rien faire si le message est vide
//     if (messageText === "") return; 

//     // Crée un nouvel élément de message
//     const messageContainer = document.createElement("div");
//     messageContainer.classList.add("chatMessageSingle", "flex", "items-start", "mb-5", "w-full");
//     messageContainer.setAttribute("data-user-id", userId?.toString() || "");
//     console.log('Message has id: ' + messageContainer.getAttribute("data-user-id"));

//     const messageHTML = `
//     <img class="w-8 h-8 rounded-full" src="http://localhost:8080/user${avatar}" alt="User image">
//     <div class="flex flex-col w-full leading-1.5 p-4 border-gray-200 bg-gray-100 rounded-e-xl rounded-es-xl dark:bg-gray-700">
//         <div class="flex items-center space-x-2 rtl:space-x-reverse">
//             <span class="text-sm font-semibold text-gray-900 dark:text-white">${username}</span>
//             <span class="text-sm font-normal text-gray-500 dark:text-gray-400">11:46</span>
//         </div>
//         <p class="text-sm text-left  py-2.5 text-gray-900 dark:text-white">${messageText}</p>
//         <span class="text-sm text-right font-normal text-gray-500 dark:text-gray-400">Delivered</span>
//     </div>
//     `;

//     messageContainer.innerHTML = messageHTML;
//     chatMessagesContainer?.insertBefore(messageContainer, chatMessagesContainer.querySelector(".grow"));

//     // Réinitialise le champ d'entrée
//     if (chatMessageInput)
//         chatMessageInput.innerHTML = "";
// }

async function sendMessage(userId: string) {
    const user = UserState.getUser();
    const username = user?.username;
    const avatar = user?.avatar;
    const chatMessageInput = document.getElementById("chatMessage") as HTMLInputElement;
    const messageText = chatMessageInput?.value;

    if (!messageText || messageText.trim() === "") return;

    try {
        const response = await fetch(`http://localhost:8084/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                senderId: user?.id,
                receiverId: userId,
                content: messageText,
            }),
        });

        if (!response.ok) throw new Error("Erreur lors de l'envoi du message");

        displayMessage(user?.id.toString(), username, avatar, messageText, "11:46");
        chatMessageInput.value = "";
    } catch (error) {
        console.error("Erreur d'envoi du message :", error);
    }
}



function displayMessage(userId: string, username: string, avatar: string, content: string, time: string) {
    const chatMessagesContainer = document.getElementById("chatMessages");

    const messageContainer = document.createElement("div");
    messageContainer.classList.add("chatMessageSingle", "flex", "items-start", "mb-5", "w-full");
    messageContainer.setAttribute("data-user-id", userId);

    const messageHTML = `
    <img class="w-8 h-8 rounded-full" src="http://localhost:8080/user${avatar}" alt="User image">
    <div class="flex flex-col w-full leading-1.5 p-4 border-gray-200 bg-gray-100 rounded-e-xl rounded-es-xl dark:bg-gray-700">
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
}


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
    const chatConvs = document.querySelectorAll('.chatConv');
    chatConvs.forEach(chatConv => {
        chatConv.addEventListener('click', () => {
            const userId = chatConv.getAttribute('data-user-id');
            if (userId) openChatWindow(userId);
        });
    });
}


async function openChatWindow(userId: string) {
    const friendsListContainer = document.getElementById("chat-friends-list");
    if (friendsListContainer) friendsListContainer.classList.add("hidden");

    const chatInput = document.getElementById("chatInput");
    if (chatInput) chatInput.classList.remove("hidden");

    const chatTitle = document.getElementById("chatTitle");
    if (chatTitle) {
        const user = UserState.getAllUsers().find(u => u.id === parseInt(userId));
        chatTitle.innerHTML = user ? user.username : "Chat";
    }

    const chatMessagesContainer = document.getElementById("chatMessages");
    if (chatMessagesContainer) {
        chatMessagesContainer.innerHTML = "";
        chatMessagesContainer.classList.remove("hidden");
    }

    // Récupérer les anciens messages
    try {
        const response = await fetch(`http://localhost:8084/chat/messages/${2}/${1}`);
        if (!response.ok) throw new Error("Erreur lors de la récupération des messages");

        const messages = await response.json();
        messages.forEach((msg: any) => {
            displayMessage(
                msg.senderId.toString(),
                msg.senderId === UserState.getUser()?.id ? "Moi" : chatTitle?.innerHTML || "Utilisateur",
                "",
                msg.content,
                "11:46"
            );
        });
    } catch (error) {
        console.error("Erreur de chargement des messages :", error);
    }

    // Gestion du bouton retour
    const goBackButton = document.getElementById("goBack");
    const closeChatButton = document.getElementById("closeChat");

    if (closeChatButton && goBackButton) {
        closeChatButton.classList.add("hidden");
        goBackButton.classList.remove("hidden");

        goBackButton.onclick = () => {
            if (friendsListContainer) friendsListContainer.classList.remove("hidden");
            if (chatInput) chatInput.classList.add("hidden");
            if (chatTitle) chatTitle.innerHTML = "CHAT";
            if (chatMessagesContainer) chatMessagesContainer.classList.add("hidden");

            goBackButton.classList.add("hidden");
            closeChatButton.classList.remove("hidden");
        };
    }

    // Associer le bouton d'envoi
    const sendButton = document.getElementById("sendButton");
    sendButton?.replaceWith(sendButton.cloneNode(true));
    const newSendButton = document.getElementById("sendButton");

    newSendButton?.addEventListener("click", function () {
        sendMessage(userId);
    });
}



export function chat(): void {
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

}