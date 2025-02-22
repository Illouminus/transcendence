import { checkAuth, logout } from "./auth.service";
import { redirectTo } from "../router";

export async function setupUI() {
	const isAuth = await checkAuth();
	console.log("User Authenticated:", isAuth);
	toggleVisibility("login-button", !isAuth);
	toggleVisibility("signup-button", !isAuth);
	toggleVisibility("dashboard-button", isAuth);
	toggleVisibility("inbox-button", isAuth);
	toggleVisibility("settings-button", isAuth);
	toggleVisibility("friends-button", isAuth);
	toggleVisibility("game-button", isAuth);
	toggleVisibility("logout-button", isAuth);

	document.getElementById("signup-button")?.addEventListener("click", async (e) => {
		await setupUI();
		redirectTo("/signup");
	});

	document.getElementById("login-button")?.addEventListener("click", async (e) => {
		await setupUI();
		redirectTo("/login");
	});

	document.getElementById("logout-button")?.addEventListener("click", async () => {
		await logout();
		await setupUI();
		redirectTo("/");
	});

	document.getElementById("logo-button")?.addEventListener("click", async () => {
		await setupUI();
		redirectTo("/");
	});

	document.getElementById("dashboard-button")?.addEventListener("click", async () => {
		await setupUI();
		redirectTo("/dashboard");
	});
}

function toggleVisibility(elementId: string, isVisible: boolean) {
	document.getElementById(elementId)?.classList.toggle("hidden", !isVisible);
}
