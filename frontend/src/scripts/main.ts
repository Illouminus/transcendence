import { setupUI } from "./services/ui.service";
import { handleRouting } from "./router";
import { onSignupClick, onLoginClick, onLogoutClick, onLogoClick, onProfileClick, onSettingsClick } from "./services/click.service";
import { UserState } from "./userState";
import { fetchUserProfile } from "./services/auth.service";


document.addEventListener("DOMContentLoaded", async () => {

	// Global event listeners
	document.getElementById("signup-button")?.addEventListener("click", onSignupClick);
	document.getElementById("login-button")?.addEventListener("click", onLoginClick);
	document.getElementById("logout-button")?.addEventListener("click", onLogoutClick);
	document.getElementById("logo-button")?.addEventListener("click", onLogoClick);
	document.getElementById("profile-button")?.addEventListener("click", onProfileClick);
	document.getElementById("settings-button")?.addEventListener("click", onSettingsClick);

	//Fetch user profile and set user state accordingly
	const user = await fetchUserProfile();
	const userAuth = await fetch("http://localhost:8080/aggregated/profile", {
		method: "GET",
		credentials: "include",
	});
	const userJson = await userAuth.json();
	
	console.log("User from auth", userJson);

	console.log("Basic user", user);
	if (user) {
		if(UserState.getUser() === null)
			UserState.updateUser(user);
		UserState.setUser(user);
		console.log("User from state", UserState.getUser());
	}
	else {
		UserState.logout();
	}

	await setupUI();
	handleRouting();
});


