import { checkAuth, logout } from "./auth.service";
import { redirectTo } from "../router";

export async function setupUI() {
	const isAuth = await checkAuth();
	toggleVisibility("login-button", !isAuth);
	toggleVisibility("signup-button", !isAuth);
	toggleVisibility("dashboard-button", isAuth);
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
