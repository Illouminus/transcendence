import { fetchAndRender } from "./outils";
import { login, renderGoogleButton, login2FA, handleSignupSubmit, fetchUserProfile, handleUpdateProfile } from "../services/auth.service";
import {UserState} from "../userState";


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


  



export async function loadProfilePage() {
	await fetchAndRender("profile");
	document.querySelector("form")?.addEventListener("submit", handleUpdateProfile);
	const ctx = document.getElementById('myChart');
	const avatar = document.getElementById("profile-avatar") as HTMLImageElement;
	const username = document.getElementById("profile-username") as HTMLInputElement;
	const usernameChange = document.getElementById("username") as HTMLInputElement;
	const email = document.getElementById("profile-email") as HTMLInputElement;
	const wins = document.getElementById("profile-wins") as HTMLInputElement;
	const losses = document.getElementById("profile-losses") as HTMLInputElement;
	const totalGames = document.getElementById("profile-total-games") as HTMLInputElement;
	const totalTournaments = document.getElementById("profile-total-tournaments") as HTMLInputElement;

	const user = UserState.getUser();
	console.log(user);
	if (avatar) {
		avatar.onerror = () => {
			avatar.onerror = null;
			avatar.src = "http://localhost:8080/user/images/default_avatar.png";
		};
		if (user?.avatarUrl) {
			avatar.src = `http://localhost:8080/user/${user.avatarUrl}`;
		} else {
			avatar.src = "http://localhost:8080/user/images/default_avatar.png";
		}
	}
	if (username)
		username.innerHTML = user?.username ?? "";
	if (usernameChange)
		usernameChange.value = user?.username ?? "";
	if (email)
		email.value = user?.email ?? "";
	if (wins)
		wins.innerHTML = user?.wins.toString() ?? "";
	if (losses)
		losses.innerHTML = user?.losses.toString() ?? "";
	if (totalGames)
		totalGames.innerHTML = user?.totalGames?.toString() ?? "";
	if (totalTournaments)
		totalTournaments.innerHTML = user?.totalTournaments?.toString() ?? "";


	new Chart(ctx, {
		type: 'bar',
		data: {
		  labels: ['Game', 'Wins', 'Loss', 'Tournaments'],
		  datasets: [{
			label: 'Statistiques',
			data: [8, 2, 16, 5],
			borderWidth: 1,
			backgroundColor: [
				'rgba(255, 99, 132, 0.2)',
				'rgba(255, 159, 64, 0.2)',
				'rgba(255, 205, 86, 0.2)',
				'rgba(75, 192, 192, 0.2)',
			  ],
		  }],
		  backgroundColor: ['#3b82f6', '#22c55e', '#ef4444', '#f97316'],
		  borderRadius: 8,
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