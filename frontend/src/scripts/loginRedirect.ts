import { renderGoogleButton } from "./services/auth.service";

// Charge dynamiquement le contenu en fonction de l'URL actuelle
handleRouting();

// Écoute les changements d'historique (bouton "Retour" ou "Avancer")
window.addEventListener("popstate", handleRouting);

// Fonction pour charger la page login
async function loadLoginPage() {
	try {
		const response = await fetch("./src/pages/login.html");
		if (!response.ok) {
			throw new Error("Erreur lors du chargement de la page login");
		}
		const html = await response.text();
		document.body.innerHTML = html;
		await renderGoogleButton();
	} catch (error) {
		console.error("Erreur :", error);
	}
}

// Fonction pour charger la page d'accueil
async function loadHomePage() {
	try {
		const response = await fetch("./index.html");
		if (!response.ok) {
			throw new Error("Erreur lors du chargement de la page d'accueil");
		}
		const html = await response.text();
		document.body.innerHTML = html;
	} catch (error) {
		console.error("Erreur :", error);
	}

	// Réattacher l'écouteur d'événement sur le bouton
	const loginButton = document.getElementById("login-button");
	if (loginButton) {
		loginButton.addEventListener("click", async () => {
			window.history.pushState({}, "", "/login");
			await loadLoginPage();
			renderGoogleButton();
		});
	}
}

// Fonction pour gérer les changements d'URL
function handleRouting() {
	if (window.location.pathname === "/login") {
		loadLoginPage();
	} else {
		loadHomePage();
	}
}
