import { redirectTo } from "../router";
import { setupUI } from "./ui.service";
import { User } from "../models/user.model";
import { showAlert } from "./alert.service";
import { UserState } from "../userState";
import { loadSettingsPage } from "../loaders/loaders";
import { setUpdateAvatar } from "../loaders/outils";

declare var google: any;

// Google OAuth 2.0 Client ID
const clientId = "747067169-6jotvfqmsp06iq9muu28jq2547q3v32s.apps.googleusercontent.com";

const API_URL = "http://localhost:8080/auth";
const API_URL_USER = "http://localhost:8080/user";
const API_AGREGATED = "http://localhost:8080";


// Function to fetch the user profile from the user API

export async function fetchUserProfile(): Promise<User | null> {
	try {
		const res = await fetch(`${API_AGREGATED}/aggregated/profile`, { credentials: "include" });
		if (res.ok) {
			const user: User = await res.json();
			return user;
		}
		return null;
	} catch (error: any) {
		console.error("Error fetching user profile:", error);
		showAlert("Error fetching user profile: " + error.message, "danger");
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
			UserState.updateUser(user);
		await setupUI();
		redirectTo("/");
	} catch (error: any) {
		console.error("2FA failed:", error);
		showAlert("2FA failed: " + error.message, "danger");
	}
}

// Function to login the user using the email and password
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

// Function to logout the user from the application
export async function logout() {
	try {
		await fetch(`${API_URL}/logout`, { method: "GET", credentials: "include" });
		UserState.logout();
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

// Function to handle the response from the Google Sign-In / 
// Login by sending the ID token to the backend or register the user

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
				return;;
			
			}
			console.log("Google Sign-In response:", data);
			if(data.user)
			{
				UserState.setUser(data.user);
				console.log("User from state", UserState.getUser());
			}
			showAlert("Google Sign-In successful", "success");
			const user = await fetchUserProfile();
			if (user)
				UserState.updateUser(user);
			console.log("User from state after update from user", UserState.getUser());
			await setupUI();
			redirectTo("/");
		})
		.catch((err) => {
			showAlert("Google Sign-In failed: " + err.message, "danger");
		});
}


// Function to handle the user registration form submission
export async function handleSignupSubmit(e: Event): Promise<void> {
	e.preventDefault();

	const username = (document.getElementById("username") as HTMLInputElement).value;
	const email = (document.getElementById("email") as HTMLInputElement).value;
	const password = (document.getElementById("password") as HTMLInputElement).value;


	const formData = new FormData();
	formData.append("username", username);
	formData.append("email", email);
	formData.append("password", password);

	try {
		const res = await fetch(`${API_URL}/register`, {
			method: "POST",
			body: formData,
			credentials: "include",
		});
		if (!res.ok) {
			const errorData = await res.json();
			throw new Error(errorData.error || `Registration failed: ${res.statusText}`);
		}
		console.log("Registration response:", res);
		const data = await res.json();
		console.log("Registration response:", data);
		if (data.message === "User registered!")
			showAlert("Registration successful", "success");
		else
			showAlert("Registration failed: " + data.error, "danger");
		await setupUI();
		redirectTo("/");
	} catch (error: any) {
		showAlert("Registration error: " + error.message, "danger");
	}
}



export async function handleUpdateProfile(e: Event): Promise<void> {
	e.preventDefault();
	const username = (document.getElementById("username") as HTMLInputElement).value;
	const email = (document.getElementById("profile-email") as HTMLInputElement).value;
	const password = (document.getElementById("password") as HTMLInputElement).value;

	console.log("Username:", username);
	console.log("Email:", email);
	console.log("Password:", password);
  
	if (!username.trim()) {
	  showAlert("Username is required", "danger");
	  return;
	}
  
	if (!email.trim()) {
	  showAlert("Email is required", "danger");
	  return;
	}

  
	const formData = new FormData();
	formData.append("username", username);
	formData.append("email", email);
	
	if (password.trim()) {
	  formData.append("password", password);
	}
	
	const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
	if (submitButton) {
	  submitButton.disabled = true;
	  submitButton.textContent = "Updating...";
	}
  
	try {
	  const res = await fetch(`${API_URL}/update`, {
		method: "POST",
		body: formData,
		credentials: "include",
	  });
	  
	  if (!res.ok) {
		const errorData = await res.json();
		throw new Error(errorData.error || `Update failed: ${res.statusText}`);
	  }
	  
	  const data = await res.json();
	  
	  if (data.message === "User updated successfully") {
		showAlert("Update was successful", "success");
	  }
	  const user = await fetchUserProfile();
	  if (user)
		UserState.updateUser(user);
	
	  await loadSettingsPage();
	} catch (error: any) {
	  console.error("Update error:", error);
	  showAlert("Update error: " + error.message, "danger");
	} finally {
	  if (submitButton) {
		submitButton.disabled = false;
		submitButton.textContent = "Save Changes";
	  }
	}
  }



  export async function handleUpdateAvatar(e: Event): Promise<void> {
	e.preventDefault();
	const avatarInput = document.getElementById("avatar-update") as HTMLInputElement;
	console.log("Avatar input:", avatarInput);

	if (avatarInput.files && avatarInput.files[0]) {
	  const file = avatarInput.files[0];
	  
	  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
	  if (!validTypes.includes(file.type)) {
		showAlert("Invalid file type. Only JPEG, PNG, GIF and WebP images are allowed.", "danger");
		return;
	  }
	  
	  const maxSize = 5 * 1024 * 1024; 
	  if (file.size > maxSize) {
		showAlert(`File too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`, "danger");
		return;
	  }
	}
  
	const formData = new FormData();
	
	if (avatarInput.files && avatarInput.files[0]) {
	  formData.append("avatar", avatarInput.files[0]);
	}
	const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
	if (submitButton) {
	  submitButton.disabled = true;
	  submitButton.textContent = "Updating...";
	}
  
	try {
	  const res = await fetch(`${API_URL_USER}/updatePhoto`, {
		method: "POST",
		body: formData,
		credentials: "include",
	  });
	  
	  if (!res.ok) {
		const errorData = await res.json();
		throw new Error(errorData.error || `Update failed: ${res.statusText}`);
	  }
	  
	  const data = await res.json();
	  
	  if (data.message === "User updated!") {
		showAlert("Update was successful", "success");
	  } else {
		showAlert("Update failed: " + (data.error || "Unknown error"), "danger");
	  }
	  
	  
	  const user = await fetchUserProfile();
	  if (user)
		UserState.setUser(user);
	
	  setUpdateAvatar();
	} catch (error: any) {
	  showAlert("Update error: " + error.message, "danger");
	} finally {
	  if (submitButton) {
		submitButton.disabled = false;
		submitButton.textContent = "Save Changes";
	  }
	}
  }
