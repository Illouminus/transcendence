import { UserState } from "../userState";

export async function setupUI() {
	const isAuth = UserState.isLoggedIn();
	toggleVisibility("login-button", !isAuth);
	toggleVisibility("signup-button", !isAuth);
	toggleVisibility("profile-button", isAuth);
	toggleVisibility("inbox-button", isAuth);
	toggleVisibility("settings-button", isAuth);
	toggleVisibility("friends-button", isAuth);
	toggleVisibility("game-button", isAuth);
	toggleVisibility("logout-button", isAuth);
	toggleVisibility("user-photo-button", isAuth);
}

function toggleVisibility(elementId: string, isVisible: boolean) {
	document.getElementById(elementId)?.classList.toggle("hidden", !isVisible);
}
