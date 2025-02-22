import { setupUI } from "./services/ui.service";
import { handleRouting } from "./router";
import { onSignupClick, onLoginClick, onLogoutClick, onLogoClick, onDashboardClick } from "./services/click.service";

document.addEventListener("DOMContentLoaded", async () => {

	document.getElementById("signup-button")?.addEventListener("click", onSignupClick);
	document.getElementById("login-button")?.addEventListener("click", onLoginClick);
	document.getElementById("logout-button")?.addEventListener("click", onLogoutClick);
	document.getElementById("logo-button")?.addEventListener("click", onLogoClick);
	document.getElementById("dashboard-button")?.addEventListener("click", onDashboardClick);
	await setupUI();
	handleRouting();
});


