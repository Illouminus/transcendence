import { fetchAndRender, setupLoginButton } from "./outils";
import { checkAuth, login, logout, renderGoogleButton } from "../services/auth.service";
import { setupUI } from "../services/ui.service";
import { redirectTo } from "../router";

export async function loadHomePage() {
	await fetchAndRender("index");
	await setupUI()
	setupLoginButton();
}

export async function loadLoginPage() {
	await fetchAndRender("login");
	renderGoogleButton();
	document.querySelector("form")?.addEventListener("submit", async (e) => {
		e.preventDefault();
		const email = (document.getElementById("email") as HTMLInputElement).value;
		const password = (document.getElementById("password") as HTMLInputElement).value;
		await login(email, password);
	});
}

export async function loadSignupPage() {
	await fetchAndRender("signup");
}

export async function loadDashboardPage() {
	await fetchAndRender("dashboard");

	if (!(await checkAuth())) return redirectTo("/login");
	document.getElementById("logout-button")?.addEventListener("click", async () => {
		await logout();
	});
}