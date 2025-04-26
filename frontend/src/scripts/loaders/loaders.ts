import { loadPongPageScript} from "../pong";
import { fetchAndRender, setUpdateAvatar } from "./outils";
import { loginHandler, renderGoogleButton, login2FA, registerHandler } from "../services/auth.service";
import { GameEvent, UserState } from "../userState";
import {succesSVG, errorSVG} from "./outils"
import { handleUpdateProfile, handleUpdateAvatar, enable2FA, disable2FA } from "../services/user.service";
import { fetchUsers, loadUserProfileData } from "../users";
import { initializeFriends } from "../friends";
import { initializeGameModeSelection } from "../gameMode";
import {  disposeChampionshipPage, initializeChampionship } from "../championship";



let previousDispose: (() => void) | null = null;
export let championshipGameEventHandler: ((event: GameEvent) => void) | null = null;

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
		await loginHandler(email, password);
	});
}

export async function loadGameModePage() {
	await fetchAndRender("game-mode");
	await initializeGameModeSelection();
	const friendSelect = document.querySelector('.friend-selector select') as HTMLSelectElement;
	
	// Populate friend selector with online friends
	const user = UserState.getUser();
	if (user?.friends) {
		const onlineFriends = user.friends.filter(friend => friend.online);
		onlineFriends.forEach(friend => {
			const option = document.createElement('option');
			option.value = friend.friend_id.toString();
			option.textContent = friend.friend_email;
			//friendSelect.appendChild(option);
		});
	}
}


export async function loadSignupPage() {
	await fetchAndRender("signup");
	document.querySelector("form")?.addEventListener("submit", registerHandler);
}


export async function loadSettingsPage() {
	await fetchAndRender("settings");

	document.querySelector("#update-avatar-form")?.addEventListener("submit", handleUpdateAvatar);
	document.querySelector("#profile-edit-form")?.addEventListener("submit", handleUpdateProfile);

	const username = document.getElementById("profile-username") as HTMLInputElement;
	const usernameChange = document.getElementById("username") as HTMLInputElement;
	const email = document.getElementById("profile-email") as HTMLInputElement;

	const label2FA = document.getElementById('2faLabel') as HTMLLabelElement;
	const span2FA = document.getElementById('span2FA') as HTMLSpanElement; 
	const faInput = document.getElementById('2faInput') as HTMLInputElement;

	faInput.addEventListener('change', async () => {
		if (faInput.checked) {
		  await enable2FA();
		  loadSettingsPage();
		} else {
		  await disable2FA();
		  loadSettingsPage();
		}
	  });


	const user = UserState.getUser();

	if(user?.is_google_auth)
		label2FA.style.display = "none";


	if (user?.two_factor_enabled) {
		span2FA.innerText = "Disable 2FA";
		faInput.checked = true;
	}
	else {
		span2FA.innerText = "Enable 2FA";
		faInput.checked = false;
	}

	
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

	const verified = user?.is_verified ?? false;
	const twoFactor = user?.two_factor_enabled ?? false;
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
		const email = UserState.getTempEmail();
		await login2FA(email, code);
	});
}

export async function loadPongPage() {
	if (previousDispose) {
	  previousDispose();
	  previousDispose = null;
	}
  
	await fetchAndRender("pong");
	previousDispose = await loadPongPageScript(); // сохраняем новую dispose-функцию
  }

export async function loadUsersPage(): Promise<void> {
    try {
        await fetchAndRender("users");
        await new Promise(resolve => setTimeout(resolve, 0));
        await fetchUsers();
    } catch (error) {
        console.error("Error loading users page:", error);
    }
}

export async function loadUserProfilePage(): Promise<void> {
    try {
        await fetchAndRender("user-profile");
        await loadUserProfileData();
    } catch (error) {
        console.error("Error loading user profile page:", error);
    }
}


export async function loadFriendsPage(): Promise<void> {
	try {
		await fetchAndRender("friends");
		initializeFriends();
		// Ensure the DOM is updated before attaching event listeners
		await new Promise(resolve => setTimeout(resolve, 0));
		//await fetchUsers();
	} catch (error) {
		console.error("Error loading friends page:", error);
	}
}


export async function loadChampionshipPage(): Promise<void> {

	disposeChampionshipPage();
	await fetchAndRender("championship");
	initializeChampionship();
}
