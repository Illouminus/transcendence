// Loaders / Pages
import { loadHomePage } from './loaders/loaders';
import { loadLoginPage } from './loaders/loaders';
import { loadSignupPage } from './loaders/loaders';

// Fonction pour gérer les changements d'URL et charger la page appropriée
export function handleRouting() {
  const path = window.location.pathname;
  if (path === "/login") {
    loadLoginPage();
  } else if (path === "/signup") {
    loadSignupPage();
  } else {
    loadHomePage();
  }
}

// Fonction pour écouter les événements de changement d'historique (Retour / Avancer)
export function setupRouting() {
  // Charge dynamiquement le contenu en fonction de l'URL actuelle
  handleRouting();

  // Écoute les changements d'historique (bouton "Retour" ou "Avancer")
  window.addEventListener("popstate", handleRouting);
}
