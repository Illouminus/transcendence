import { setupUI } from "./services/ui.service";
import { handleRouting } from "./router";
import { onSignupClick, onLoginClick, onLogoutClick, onLogoClick, onProfileClick, 
	onSettingsClick, onUsersClick, onFriendsClick, onPongClick} from "./services/click.service";
import { UserState } from "./userState";
import { fetchUserProfile } from "./services/user.service";
import { fetchAllUsers } from "./loaders/outils";
import { connectUserWebSocket } from "./userWebsocket";
import { connectGameWebSocket } from "./gameWebsocket";
import { createGameInvitationModal } from "./gameInvitationModal";
import { chat } from "./chat";


document.addEventListener("DOMContentLoaded", async () => {

	// Global event listeners
	document.getElementById("signup-button")?.addEventListener("click", onSignupClick);
	document.getElementById("login-button")?.addEventListener("click", onLoginClick);
	document.getElementById("logout-button")?.addEventListener("click", onLogoutClick);
	document.getElementById("logo-button")?.addEventListener("click", onLogoClick);
	document.getElementById("profile-button")?.addEventListener("click", onProfileClick);
	document.getElementById("pong-button")?.addEventListener("click", onPongClick);
	document.getElementById("settings-button")?.addEventListener("click", onSettingsClick);
	document.getElementById("users-button")?.addEventListener("click", onUsersClick);
	document.getElementById("friends-button")?.addEventListener("click", onFriendsClick);

	const token = localStorage.getItem("token");

	if(token) 
	{
		const user = await fetchUserProfile();
		if(!user)
		{
			UserState.logout();
			localStorage.removeItem("token");
		}
		const allUsers = await fetchAllUsers();
		UserState.setUserSocket(connectUserWebSocket(token));
		UserState.setGameSocket(connectGameWebSocket(token));

		if(allUsers)
			UserState.setAllUsers(allUsers);
	
		if (user) {
			if(UserState.getUser() === null)
				UserState.updateUser(user);
			UserState.setUser(user);
		}
		else
		{
			UserState.logout();
			localStorage.removeItem("token");
		}
	}
	
	await setupUI();
	chat();
	handleRouting();
});


