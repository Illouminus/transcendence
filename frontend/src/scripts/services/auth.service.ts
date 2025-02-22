import { loadDashboardPage, loadLoginPage } from "../loaders/loaders";
import { redirectTo } from "../router";

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

		redirectTo("/dashboard");
	} catch (error) {
		console.error("Login failed:", error);
	}
}


export async function logout() {
	await fetch(`${API_URL}/logout`, { method: "POST", credentials: "include" });
	redirectTo("/login");
}



// Function to render the Google Sign-In button
export async function renderGoogleButton() {
	google.accounts.id.initialize({
		client_id: clientId,
		callback: handleCredentialResponse,
	});
	const container = document.getElementById("google-signin-button");
	console.log("Google button container:", container);
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
		.then((data) => {
			loadDashboardPage();
		})
		.catch((err) => console.error(err));
}



// window.onload = () => {
// 	google.accounts.id.initialize({
// 		client_id: clientId,
// 		callback: handleCredentialResponse,
// 	});

// };