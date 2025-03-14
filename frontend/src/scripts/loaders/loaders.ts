import { fetchAndRender, setUpdateAvatar } from "./outils";
import { login, renderGoogleButton, login2FA, handleSignupSubmit, handleUpdateAvatar, handleUpdateProfile } from "../services/auth.service";
import {UserState} from "../userState";
import { FlowGraphSaturateBlock } from "babylonjs";
import {succesSVG, errorSVG} from "./outils"


export async function loadHomePage() {
	await fetchAndRender("dog");
}

export async function loadLoginPage() {
	await fetchAndRender("login");
	renderGoogleButton();
	document.querySelector("form")?.addEventListener("submit", async (e) => {
		e.preventDefault();
		const email = (document.getElementById("email") as HTMLInputElement).value;
		const password = (document.getElementById("password") as HTMLInputElement).value;
		await login(email, password);
	});
}

export async function loadSignupPage() {
	await fetchAndRender("signup");
	document.querySelector("form")?.addEventListener("submit", handleSignupSubmit);
}

export async function loadSettingsPage() {
	console.log("Settings Page");
	await fetchAndRender("settings");

	document.querySelector("#update-avatar-form")?.addEventListener("submit", handleUpdateAvatar);
	document.querySelector("#profile-edit-form")?.addEventListener("submit", handleUpdateProfile);

	const username = document.getElementById("profile-username") as HTMLInputElement;
	const usernameChange = document.getElementById("username") as HTMLInputElement;
	const email = document.getElementById("profile-email") as HTMLInputElement;

	const user = UserState.getUser();
	await setUpdateAvatar();
	if (username)
		username.innerHTML = user?.username ?? "";
	if (usernameChange)
		usernameChange.value = user?.username ?? "";
	if (email)
		email.value = user?.email ?? "";

}
  


export async function loadProfilePage() {
	await fetchAndRender("profile");
	const ctx = document.getElementById('myChart');

	const statusSpan = document.getElementById('verification-status') as HTMLSpanElement;
	const factorVerificationSpan = document.getElementById('2fa-enabled') as HTMLSpanElement;
	const isOnlineSpan = document.getElementById('online-user') as HTMLSpanElement;
	const username = document.getElementById('profile-username') as HTMLSpanElement;

	const user = UserState.getUser();

	const verified = true;
	const twoFactor = false;
	const online = true;

	username.innerHTML = user?.username ?? "";
	if (verified) {
		statusSpan.innerHTML = succesSVG;
	  } else {
		statusSpan.innerHTML = errorSVG;
	  }

	  if (twoFactor) {
		factorVerificationSpan.innerHTML = succesSVG
	  } else {
		factorVerificationSpan.innerHTML = errorSVG
	  }

	  if (online) {
		isOnlineSpan.innerHTML = succesSVG
	  }
	  else {
		isOnlineSpan.innerHTML = errorSVG
	  }

	await setUpdateAvatar();


	new Chart(ctx, {
		type: 'bar',
		data: {
		  labels: ['Game', 'Wins', 'Loss', 'Tournaments'],
		  datasets: [{
			label: 'Statistiques',
			data: [8, 2, 16, 5],
			borderWidth: 2,
			backgroundColor: [
				'rgba(255, 99, 132, 0.2)',
				'rgba(255, 159, 64, 0.2)',
				'rgba(255, 205, 86, 0.2)',
				'rgba(75, 192, 192, 0.2)',
			  ],
			  borderRadius: 8,
		  }],

		},
		options: {
		  scales: {
			y: {
			  beginAtZero: true
			}
		  }
		}
	  });
	  

}

export async function load2FAPage() {
	console.log("2FA Page");
	await fetchAndRender("2fa");
	document.querySelector("form")?.addEventListener("submit", async (e) => {
		e.preventDefault();
		const code = (document.getElementById("code") as HTMLInputElement).value;
		const email = (document.getElementById("email-2fa") as HTMLInputElement).value;
		await login2FA(email, code);
	});
}