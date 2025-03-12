import { setupUI } from "./services/ui.service";
import { handleRouting } from "./router";
import { onSignupClick, onLoginClick, onLogoutClick, onLogoClick, onProfileClick } from "./services/click.service";
import { UserState } from "./userState";
import { fetchUserProfile } from "./services/auth.service";


document.addEventListener("DOMContentLoaded", async () => {

	// Global event listeners
	document.getElementById("signup-button")?.addEventListener("click", onSignupClick);
	document.getElementById("login-button")?.addEventListener("click", onLoginClick);
	document.getElementById("logout-button")?.addEventListener("click", onLogoutClick);
	document.getElementById("logo-button")?.addEventListener("click", onLogoClick);
	document.getElementById("profile-button")?.addEventListener("click", onProfileClick);

	//Fetch user profile and set user state accordingly
	const user = await fetchUserProfile();
	console.log(user);

	if (user) {
		UserState.setUser(user);
	}
	else {
		UserState.logout();
	}

	await setupUI();
	handleRouting();
});


