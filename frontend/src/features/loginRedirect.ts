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

    // Ajouter l'événement de redirection vers "Sign up" dans login
    const signupLink = document.getElementById("signup-button");
    if (signupLink) {
      signupLink.addEventListener("click", async (e) => {
        e.preventDefault(); // Empêche le comportement par défaut du lien
        window.history.pushState({}, "", "/signup");
        await loadSignupPage();
      });
    }
  } catch (error) {
    console.error("Erreur :", error);
  }
}

// Fonction pour charger la page signup
async function loadSignupPage() {
  try {
    const response = await fetch("./src/pages/signup.html");
    if (!response.ok) {
      throw new Error("Erreur lors du chargement de la page d'inscription");
    }
    const html = await response.text();
    document.body.innerHTML = html;
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
    });
  }
}

// Fonction pour gérer les changements d'URL
function handleRouting() {
  const path = window.location.pathname;
  if (window.location.pathname === "/login") {
    loadLoginPage();
  } else if (path == "/signup") {
    loadSignupPage();
  } else {
    loadHomePage();
  }
}
