import { redirectTo } from "../router";
import { setupUI } from "./ui.service";
import { User } from "../models/user.model";
import { showAlert } from "./alert.service";
import { UserState } from "../userState";

declare var google: any;

// Google OAuth 2.0 Client ID
const clientId = "747067169-6jotvfqmsp06iq9muu28jq2547q3v32s.apps.googleusercontent.com";

const API_URL = "http://localhost:5555/auth";

// Проверка авторизации
export async function checkAuth(): Promise<boolean> {
	try {
		const res = await fetch(`${API_URL}/me`, { credentials: "include" });
		return res.ok;
	} catch (error) {
		console.error("Error in checkAuth:", error);
		return false;
	}
}

export async function fetchUserProfile(): Promise<User | null> {
	try {
		const res = await fetch(`${API_URL}/me`, { credentials: "include" });
		if (res.ok) {
			const user: User = await res.json();
			console.log("User profile:", user);
			return user;
		}
		return null;
	} catch (error: any) {
		console.error("Error fetching user profile:", error);
		//showAlert("Error fetching user profile: " + error.message, "danger");
		return null;
	}
}

export async function login2FA(email: string, code: string) {
	try {
		const res = await fetch(`${API_URL}/verify-2fa`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, code }),
			credentials: "include",
		});
		if (!res.ok) throw new Error("Invalid 2FA code");
		showAlert("2FA successful", "success");
		const user = await fetchUserProfile();
		if (user)
			UserState.setUser(user);
		await setupUI();
		redirectTo("/");
	} catch (error: any) {
		console.error("2FA failed:", error);
		showAlert("2FA failed: " + error.message, "danger");
	}
}

export async function login(email: string, password: string) {
	try {
		const res = await fetch(`${API_URL}/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, password }),
			credentials: "include",
		});
		if (!res.ok) throw new Error("Invalid credentials");
		showAlert("Login successful - you need to enter you 2FA code", "success");
		redirectTo("/2fa");
	} catch (error: any) {
		console.error("Login failed:", error);
		showAlert("Login failed: " + error.message, "danger");
	}
}
export async function logout() {
	try {
		await fetch(`${API_URL}/logout`, { method: "POST", credentials: "include" });
		UserState.logout();
		showAlert("Logout successful", "success");
		await setupUI();
		redirectTo("/");
	} catch (error: any) {
		console.error("Logout failed:", error);
		showAlert("Logout failed: " + error.message, "danger");
	}
}


export async function renderGoogleButton() {
	try {
		google.accounts.id.initialize({
			client_id: clientId,
			callback: handleCredentialResponse,
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

function handleCredentialResponse(response: any) {
	fetch(`${API_URL}/google-authenticator`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ idToken: response.credential }),
		credentials: "include",
	})
		.then((res) => res.json())
		.then(async (data) => {
			if (data.error) {
				showAlert("Google Sign-In Error - Possibly duplicate email", "danger");
				return;
			}
			showAlert("Google Sign-In successful", "success");
			const user = await fetchUserProfile();
			if (user)
				UserState.setUser(user);
			await setupUI();
			redirectTo("/");
		})
		.catch((err) => {
			showAlert("Google Sign-In failed: " + err.message, "danger");
		});
}

export async function handleSignupSubmit(e: Event): Promise<void> {
	e.preventDefault();

	const username = (document.getElementById("username") as HTMLInputElement).value;
	const email = (document.getElementById("email") as HTMLInputElement).value;
	const password = (document.getElementById("password") as HTMLInputElement).value;
	const avatarInput = document.getElementById("avatar") as HTMLInputElement;


	const formData = new FormData();
	formData.append("username", username);
	formData.append("email", email);
	formData.append("password", password);
	if (avatarInput.files && avatarInput.files[0]) {
		formData.append("avatar", avatarInput.files[0]);
	}

	try {
		const res = await fetch(`${API_URL}/register`, {
			method: "POST",
			body: formData,
			credentials: "include",
		});
		if (!res.ok) {
			throw new Error(`Registration failed: ${res.statusText}`);
		}
		const data = await res.json();
		if (data.ok)
			showAlert("Registration successful", "success");
		else
			showAlert("Registration failed: " + data.error, "danger");
		await setupUI();
		redirectTo("/");
	} catch (error: any) {
		console.error("Registration error:", error);
		showAlert("Registration error: " + error.message, "danger");
	}
}