import { setupUI } from "./services/ui.service";
import { handleRouting } from "./router";
import {
    onSignupClick, onLoginClick, onLogoutClick, onLogoClick, onProfileClick,
    onSettingsClick, onUsersClick, onFriendsClick, onPongClick
} from "./services/click.service";
import { UserState } from "./userState";
import { fetchUserProfile } from "./services/user.service";
import { fetchAllUsers } from "./loaders/outils";
import { connectUserWebSocket } from "./userWebsocket";
import { connectGameWebSocket } from "./gameWebsocket";
import { connectChatWebSocket } from "./chatWebSocket";
import { chat } from "./chat";
import { getFriendsNumber } from "./friends";



const attachedListeners: { element: HTMLElement, event: string, handler: EventListenerOrEventListenerObject }[] = [];

function attachListener(id: string, event: string, handler: EventListenerOrEventListenerObject) {
    const element = document.getElementById(id);
    if (element) {
        element.addEventListener(event, handler);
        attachedListeners.push({ element, event, handler });
    }
}

export function disposeGlobalListeners() {
    for (const { element, event, handler } of attachedListeners) {
        element.removeEventListener(event, handler);
    }
    attachedListeners.length = 0;
}

async function initializeApp() {
    attachListener("signup-button", "click", onSignupClick);
    attachListener("login-button", "click", onLoginClick);
    attachListener("logout-button", "click", onLogoutClick);
    attachListener("logo-button", "click", onLogoClick);
    attachListener("profile-button", "click", onProfileClick);
    attachListener("pong-button", "click", onPongClick);
    attachListener("settings-button", "click", onSettingsClick);
    attachListener("users-button", "click", onUsersClick);
    attachListener("friends-button", "click", onFriendsClick);

    const token = localStorage.getItem("token");

    if (token) {
        const user = await fetchUserProfile();

        if (user) {
            UserState.setUser(user);
            const allUsers = await fetchAllUsers();
            if (allUsers) {
                UserState.setAllUsers(allUsers);
            }

            UserState.setUserSocket(connectUserWebSocket(token));
            UserState.setGameSocket(connectGameWebSocket(token));
            UserState.setChatSocket(connectChatWebSocket(token));

            setInterval(() => {
                const socket = UserState.getUserSocket();
                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ type: 'ping' }));
                }
            }, 30_000);

            setInterval(() => {
                const socket = UserState.getGameSocket(); 
                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ type: 'ping' }));
                }
            }, 30_000);

            setInterval(() => {
                const socket = UserState.getChatSocket(); 
                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ type: 'ping' }));
                }
            }, 30_000); 

            // chat();
            getFriendsNumber();
        } else {
            UserState.logout();
            localStorage.removeItem("token");
        }
    }
    setupUI();
    handleRouting();
}

document.addEventListener("DOMContentLoaded", initializeApp);
