import { fetchAndRender } from "./outils";
import { checkAuth, login, logout, renderGoogleButton, login2FA, handleSignupSubmit } from "../services/auth.service";
import { setupUI } from "../services/ui.service";
import { redirectTo } from "../router";

export async function loadHomePage() {
	await fetchAndRender("dog");
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
	document.querySelector("form")?.addEventListener("submit", handleSignupSubmit);
}

export async function loadDashboardPage() {
	await fetchAndRender("dashboard");

	if (!(await checkAuth())) return redirectTo("/login");
	document.getElementById("logout-button")?.addEventListener("click", async () => {
		await logout();
	});
}

export async function load2FAPage() {
	console.log("2FA Page");
	await fetchAndRender("2fa");
	document.querySelector("form")?.addEventListener("submit", async (e) => {
		e.preventDefault();
		const code = (document.getElementById("code") as HTMLInputElement).value;
		const email = (document.getElementById("email-2fa") as HTMLInputElement).value;
		await login2FA(email, code);
	});
}