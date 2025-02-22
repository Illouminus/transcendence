import { checkAuth, logout } from "./auth.service";
import { redirectTo } from "../router";

export async function setupUI() {
	const isAuth = await checkAuth();
	console.log("User Authenticated:", isAuth);
	toggleVisibility("login-button", !isAuth);
	toggleVisibility("dashboard-button", isAuth);
	toggleVisibility("logout-button", isAuth);

	document.getElementById("signup-button")?.addEventListener("click", (e) => {
		e.preventDefault();
		redirectTo("/signup");
	});

	document.getElementById("logout-button")?.addEventListener("click", async () => {
		await logout();
		await setupUI();
		redirectTo("/login");
	});

	document.getElementById("dashboard-button")?.addEventListener("click", async () => {
		await logout();
		await setupUI();
		redirectTo("/dashboard");
	});
}

function toggleVisibility(elementId: string, isVisible: boolean) {
	document.getElementById(elementId)?.classList.toggle("hidden", !isVisible);
}
