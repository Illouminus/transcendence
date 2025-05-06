import { redirectTo } from "../router";
import { setupUI } from "./ui.service";
import { showAlert } from "./alert.service";
import { UserState } from "../userState";
import { loadSettingsPage } from "../loaders/loaders";
import { fetchAllUsers, setUpdateAvatar } from "../loaders/outils";
import { fetchUserProfile } from "./user.service";
import { connectUserWebSocket } from "../userWebsocket";
import { connectGameWebSocket } from "../gameWebsocket";
import { AUTH_URL } from "../outils/config";
import { connectChatWebSocket } from "../chatWebSocket";
import { chat } from "../chat"
import { getFriendsNumber } from "../friends";


declare var google: any;

// Google OAuth 2.0 Client ID
const clientId = "747067169-6jotvfqmsp06iq9muu28jq2547q3v32s.apps.googleusercontent.com";



// Function to login the user using the email and password
// If the user has 2FA enabled, this is the function to get the email and password
// and send it to the backend
export async function login2FA(email: string, code: string) {
	try {
		const res = await fetch(`${AUTH_URL}/verify-2fa`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, code }),
			credentials: "include",
		});
		if (!res.ok) throw new Error("Invalid 2FA code");
		const response = await res.json();
		localStorage.setItem("token", response.token);
		showAlert("2FA successful", "success");
		const user = await fetchUserProfile();
		const allUsers = await fetchAllUsers();
		UserState.setUserSocket(connectUserWebSocket(response.token));
		if (allUsers)
			UserState.setAllUsers(allUsers);
		if (user)
			UserState.setUser(user);
		await setupUI();
		redirectTo("/profile");
	} catch (error: any) {
		showAlert("2FA failed: " + error.message, "danger");
	}
}

// Function to login the user using the email and password
// If the user does not have 2FA enabled, this is the function to get the email and password
// and send it to the backend
// Anf if the user has 2FA enabled, we redirect to the 2FA page
export async function loginHandler(email: string, password: string) {
	try {
		const res = await fetch(`${AUTH_URL}/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, password }),
			credentials: "include",
		});

		const data = await res.json();
		if (!res.ok) throw new Error("Invalid credentials");

		if(data.message === "2FA code sent to email")
		{
			showAlert("Login successful - you need to enter you 2FA code", "success");
			console.log("EMAIL", data.email)
			UserState.setTempEmail(data.email);
			redirectTo("/2fa");
		}
		else if(data.message === "Login successful")
		{
			showAlert("Login successful", "success");
			localStorage.setItem("token", data.token);

			UserState.setUserSocket(connectUserWebSocket(data.token));
			UserState.setGameSocket(connectGameWebSocket(data.token));
			UserState.setChatSocket(connectChatWebSocket(data.token));
			const user = await fetchUserProfile();
			const allUsers = await fetchAllUsers();
			
			if (user)
				UserState.setUser(user);
				getFriendsNumber();
				chat();
			if(allUsers)
				UserState.setAllUsers(allUsers);

			await setupUI();
			redirectTo("/profile");
		}
	} catch (error: any) {
		showAlert("Login failed: " + error.message, "danger");
	}
}

// Function to logout the user from the application
// This function sends a GET request to the backend to logout the user
// And then we update the user state and show an alert
export async function logout() {
	try {
		await fetch(`${AUTH_URL}/logout`, { method: "GET", credentials: "include" });
		UserState.logout();
		localStorage.removeItem("token");
		showAlert("Logout successful", "success");
		await setupUI();
		redirectTo("/");
	} catch (error: any) {
		showAlert("Logout failed: " + error.message, "danger");
	}
}



export async function renderGoogleButton() {
	try {
		google.accounts.id.initialize({
			client_id: clientId,
			callback: googleSignIn,
		});
		const container = document.getElementById("google-signin-button");
		if (container) {
			google.accounts.id.renderButton(container, {
				theme: "outline",
				size: "large",
			});
		}
	} catch (error: any) {
		console.error("Error initializing Google Sign-In:", error);
		showAlert("Error initializing Google Sign-In: " + error.message, "danger");
	}
}

// Function to handle the response from the Google Sign-In / 
// Login by sending the ID token to the backend or register the user
async function googleSignIn(response: any): Promise<void> {
	try {
	  const res = await fetch(`${AUTH_URL}/google-authenticator`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ idToken: response.credential }),
		credentials: "include",
	  });
	  if (res.ok)
	  	showAlert("Google Sign-In successful", "success");
	  
	  const data = await res.json();
	  localStorage.setItem("token", data.token);
	  UserState.setUserSocket(connectUserWebSocket(data.token));
	  UserState.setGameSocket(connectGameWebSocket(data.token));
	  UserState.setChatSocket(connectChatWebSocket(data.token));
	  const user = await fetchUserProfile();
	  const allUsers = await fetchAllUsers();
	  if (allUsers) {
		UserState.setAllUsers(allUsers);
	  }
	  if (user) {
		UserState.setUser(user);
		getFriendsNumber();
		chat();
	  }
	  await setupUI();
	  redirectTo("/profile");
	} catch (err: any) {
	  showAlert("Google Sign-In failed: " + err.message, "danger");
	}
  }


// Function to handle the user registration form submission
// This function gets the username, email and password from the form
// And sends it to the backend to register the user
// If the registration is successful, we show an alert and redirect to the home page
// If the registration fails, we show an alert with the error message

export async function registerHandler(e: Event): Promise<void> {
	e.preventDefault();

	const username = (document.getElementById("username") as HTMLInputElement).value;
	const email = (document.getElementById("email") as HTMLInputElement).value;
	const password = (document.getElementById("password") as HTMLInputElement).value;

	// Validation des entrées utilisateur
	if (!isUsernameValid(username)) {
		showAlert("Le nom d'utilisateur ne doit contenir que des lettres, des chiffres, et des underscores, et être compris entre 3 et 20 caractères.", "danger");
		(document.getElementById("username") as HTMLInputElement).focus();
		return; // Arrête l'exécution si le nom d'utilisateur est invalide
	}

	if (!isEmailValid(email)) {
		showAlert("Veuillez entrer une adresse email valide.", "danger");
		(document.getElementById("email") as HTMLInputElement).focus();
		return; // Arrête l'exécution si l'email est invalide
	}

	if (!isPasswordValid(password)) {
		showAlert("Le mot de passe doit contenir au moins 7 caractères, une majuscule et une minuscule.", "danger");
		(document.getElementById("password") as HTMLInputElement).focus();
		return; // Arrête l'exécution si le mot de passe est invalide
	}

	const formData = new FormData();
	formData.append("username", username);
	formData.append("email", email);
	formData.append("password", password);

	try {
		const res = await fetch(`${AUTH_URL}/register`, {
			method: "POST",
			body: formData,
			credentials: "include",
		});
		if (!res.ok) {
			const errorData = await res.json();
			throw new Error(errorData.error || `Registration failed: ${res.statusText}`);
		}
		const data = await res.json();
		console.log("Registration response:", data);
		if (data.message === "User registered!") {
			showAlert("Registration successful", "success");
		} else {
			showAlert("Registration failed: " + data.error, "danger");
		}
		await setupUI();
		redirectTo("/login");
	} catch (error: any) {
		showAlert("Registration error: " + error.message, "danger");
	}
}

// Fonction de validation du mot de passe
function isPasswordValid(password: string): boolean {
	const minLength = 7;
	const hasUpperCase = /[A-Z]/.test(password);
	const hasLowerCase = /[a-z]/.test(password);
	return password.length >= minLength && hasUpperCase && hasLowerCase;
}

// Fonction de validation de l'email
function isEmailValid(email: string): boolean {
	// Utilise une regex pour vérifier la validité de l'email
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

// Fonction de validation du nom d'utilisateur
function isUsernameValid(username: string): boolean {
	// Le nom d'utilisateur doit avoir entre 3 et 20 caractères, et contenir uniquement lettres, chiffres, et underscores
	const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
	return usernameRegex.test(username);
}
