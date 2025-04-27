import { setupUI } from "./services/ui.service";
import { handleRouting } from "./router";
import { onSignupClick, onLoginClick, onLogoutClick, onLogoClick, onProfileClick, 
    onSettingsClick, onUsersClick, onFriendsClick, onPongClick } from "./services/click.service";
import { UserState } from "./userState";
import { fetchUserProfile } from "./services/user.service";
import { fetchAllUsers } from "./loaders/outils";
import { connectUserWebSocket } from "./userWebsocket";
import { connectGameWebSocket } from "./gameWebsocket";
import { chat } from "./chat";

// === Глобальный трекер слушателей ===
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
    // === Навешиваем слушатели ===
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
        } else {
            UserState.logout();
            localStorage.removeItem("token");
        }
    }

    await setupUI();
    chat();
    handleRouting();
}

document.addEventListener("DOMContentLoaded", initializeApp);

// === Если нужно будет очистить слушатели, можно вызвать ===
// disposeGlobalListeners();