import { redirectTo } from "../router";
import { setupUI } from "./ui.service";
import { User } from "../models/user.model";

declare var google: any;

// Google OAuth 2.0 Client ID - Need to ENV variable
const clientId = "747067169-6jotvfqmsp06iq9muu28jq2547q3v32s.apps.googleusercontent.com";

const API_URL = "http://localhost:5555/auth";


// Function to check if the user is authenticated
export async function checkAuth(): Promise<boolean> {
	try {
		const res = await fetch(`${API_URL}/me`, { credentials: "include" });
		return res.ok;
	} catch {
		return false;
	}
}


export async function fetchUserProfile(): Promise<User | null> {
	try {
		const res = await fetch(`${API_URL}/me`, {
			credentials: "include",
		});
		if (res.ok) {
			const user: User = await res.json();
			console.log("User profile:", user);
			return user;
		}
		return null;
	} catch (error) {
		console.error("Error fetching user profile:", error);
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
		await checkAuth();
		await setupUI();
		redirectTo("/");
	} catch (error) {
		console.error("2FA failed:", error);
	}
}


// Function to login the user
export async function login(email: string, password: string) {
	try {
		const res = await fetch(`${API_URL}/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, password }),
			credentials: "include",
		});
		if (!res.ok) throw new Error("Invalid credentials");
		if (res.status === 200) {
			console.log("Login successful");
			//await setupUI();
			redirectTo("/2fa");
			return;
		}
		await setupUI();
		redirectTo("/");
	} catch (error) {
		console.error("Login failed:", error);
	}
}


export async function logout() {
	await fetch(`${API_URL}/logout`, { method: "POST", credentials: "include" });
	redirectTo("/");
}



// Function to render the Google Sign-In button
export async function renderGoogleButton() {
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
}

// Function to handle the Google Sign-In response
function handleCredentialResponse(response: any) {
	console.log("Encoded JWT ID token: ", response.credential);
	fetch("http://localhost:5555/auth/google-authenticator", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ idToken: response.credential }),
		credentials: "include",
	})
		.then((res) => res.json())
		.then(async (data) => {
			await setupUI();
			redirectTo("/");
		})
		.catch((err) => console.error(err));
}




export async function handleSignupSubmit(e: Event): Promise<void> {
	e.preventDefault();

	const username = (document.getElementById("username") as HTMLInputElement).value;
	const email = (document.getElementById("email") as HTMLInputElement).value;
	const password = (document.getElementById("password") as HTMLInputElement).value;
	const avatarInput = document.getElementById("avatar") as HTMLInputElement;

	console.log("Registering user", username, email, password, avatarInput.files);

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
		console.log("Registration successful", data);
		await setupUI();
		redirectTo("/");
	} catch (error) {
		console.error("Registration error:", error);
	}
}