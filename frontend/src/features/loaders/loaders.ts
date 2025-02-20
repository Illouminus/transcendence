// Home Page
export async function loadHomePage() {
    try {
      const response = await fetch("./index.html");
      if (!response.ok) {
        throw new Error("Erreur lors du chargement de la page d'accueil");
      }
      const html = await response.text();
      document.body.innerHTML = html;
  
      // Réattacher l'écouteur d'événement sur le bouton login
      const loginButton = document.getElementById("login-button");
      if (loginButton) {
        loginButton.addEventListener("click", async () => {
          window.history.pushState({}, "", "/login");
          await loadLoginPage();
        });
      }

      const dashboardButton = document.getElementById("dashboard-button");
      if (dashboardButton) {
        dashboardButton.addEventListener("click", async () => {
          window.history.pushState({}, "", "/dashboard");
          await loadDashboardPage();
        });
      }
    } catch (error) {
      console.error("Erreur :", error);
    }
}
  
// Page Login
export async function loadLoginPage() {
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
  
// Signup Page
export async function loadSignupPage() {
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


//Dahsboard
export async function loadDashboardPage() {
  try {
    const response = await fetch("./src/pages/dashboard.html");
    if (!response.ok) {
      throw new Error("Erreur lors du chargement de la page d'inscription");
    }
    const html = await response.text();
    document.body.innerHTML = html;
  } catch (error) {
    console.error("Erreur :", error);
  }
}