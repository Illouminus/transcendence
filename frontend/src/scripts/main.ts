import { setupUI } from "./services/ui.service";
import { handleRouting } from "./router";
import { onSignupClick, onLoginClick, onLogoutClick, onLogoClick, onProfileClick, 
	onSettingsClick, onUsersClick, onFriendsClick } from "./services/click.service";
import { UserState } from "./userState";
import { fetchUserProfile } from "./services/user.service";
import { fetchAllUsers } from "./loaders/outils";


document.addEventListener("DOMContentLoaded", async () => {

	// Global event listeners
	document.getElementById("signup-button")?.addEventListener("click", onSignupClick);
	document.getElementById("login-button")?.addEventListener("click", onLoginClick);
	document.getElementById("logout-button")?.addEventListener("click", onLogoutClick);
	document.getElementById("logo-button")?.addEventListener("click", onLogoClick);
	document.getElementById("profile-button")?.addEventListener("click", onProfileClick);
	document.getElementById("settings-button")?.addEventListener("click", onSettingsClick);
	document.getElementById("users-button")?.addEventListener("click", onUsersClick);
	document.getElementById("friends-button")?.addEventListener("click", onFriendsClick);

	//Fetch user profile and set user state accordingly
	const user = await fetchUserProfile();
	const allUsers = await fetchAllUsers();

	if(allUsers)
		UserState.setAllUsers(allUsers);

	if (user) {
		if(UserState.getUser() === null)
			UserState.updateUser(user);
		UserState.setUser(user);
	}
	else {
		UserState.logout();
	}

	await setupUI();
	handleRouting();
});


