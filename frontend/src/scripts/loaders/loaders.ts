import { loadPongPageScript} from "../pong";
import { fetchAndRender, setUpdateAvatar } from "./outils";
import { loginHandler, renderGoogleButton, login2FA, registerHandler } from "../services/auth.service";
import { UserState } from "../userState";
import {succesSVG, errorSVG} from "./outils"
import { handleUpdateProfile, handleUpdateAvatar, enable2FA, disable2FA } from "../services/user.service";
import { fetchUsers, loadUserProfileData } from "../users";
import { initializeFriends } from "../friends";
import { initializeGameModeSelection } from "../gameMode";
import { initializeChampionship } from "../championship";

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
			friendSelect.appendChild(option);
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


export async function fetchStat() {
    console.log("Fetching stats");
    try {
        const token = localStorage.getItem('token'); // ou autre méthode pour récupérer le token
        const response = await fetch(`http://localhost:8080/game/gameStats`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
		if (!response.ok) throw new Error("Erreur lors de la récupération des stats");

		const stats = await response.json();
		console.log(stats);
		return (stats);
    } catch (error) {
        console.error('Error fetching game statistics:', error);
    }
}


export async function fetchGames() {
    console.log("Fetching stats");
    try {
        const token = localStorage.getItem('token'); // ou autre méthode pour récupérer le token
        const response = await fetch(`http://localhost:8080/game/userGames`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
		if (!response.ok) throw new Error("Erreur lors de la récupération des games");

		const games = await response.json();
		console.log(games);
		return (games);
    } catch (error) {
        console.error('Error fetching games history:', error);
    }
}

export function createGameRow(player1: { username: string, avatar: string }, player2: { username: string, avatar: string }, score1: number, score2: number, date: string) {
    const gamesList = document.getElementById('gamesList');
    if (!gamesList) return;

    const gameRow = document.createElement('div');
    gameRow.className = 'flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-3 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-600 hover:shadow-md';
    gameRow.innerHTML = `
        <div class="flex items-center space-x-4 w-full">
            <!-- Player 1 -->
            <div class="flex items-center space-x-2 flex-1">
                <div class="relative group">
                    <img src="http://localhost:8080/user${player1.avatar}" alt="${player1.username}" 
                         class="w-10 h-10 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600 transition-transform duration-200 group-hover:scale-110">
                </div>
                <span class="text-gray-900 dark:text-white font-medium">${player1.username}</span>
            </div>
            
            <!-- Score -->
            <div class="flex items-center space-x-2 bg-gray-200 dark:bg-gray-800 px-4 py-2 rounded-lg">
                <span class="text-2xl font-bold ${score1 > score2 ? 'text-green-500' : 'text-gray-500'}">${score1}</span>
                <span class="text-gray-500 dark:text-gray-400">-</span>
                <span class="text-2xl font-bold ${score2 > score1 ? 'text-green-500' : 'text-gray-500'}">${score2}</span>
            </div>
            
            <!-- Player 2 -->
            <div class="flex items-center space-x-2 flex-1 justify-end">
                <span class="text-gray-900 dark:text-white font-medium">${player2.username}</span>
                <div class="relative group">
                    <img src="http://localhost:8080/user${player2.avatar}" alt="${player2.username}" 
                         class="w-10 h-10 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600 transition-transform duration-200 group-hover:scale-110">
                </div>
            </div>
        </div>
        <!-- Date -->
        <div class="text-sm text-gray-500 dark:text-gray-400 ml-4 whitespace-nowrap">
            ${date}
        </div>
    `;

    gamesList.appendChild(gameRow);
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return "Aujourd'hui";
    } else if (diffDays === 1) {
        return "Hier";
    } else {
        return `Il y a ${diffDays} jours`;
    }
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

	const stats = await fetchStat(); // Récupérer les stats
    if (!stats) {
        console.error("Les statistiques n'ont pas pu être récupérées.");
        return;
    }

	const games = await fetchGames(); // Récupérer les games
    if (!games) {
        console.error("Les statistiques n'ont pas pu être récupérées.");
        return;
    }
	else {
		games.forEach((game: any) => {
			const opponent = user?.friends?.find(friend => friend.friend_id === game.player2_id);
			createGameRow(
				{ username: user?.username ?? 'inconnu', avatar: user?.avatar || "" },
				{ username: opponent?.friend_username ?? 'inconnu', avatar: opponent?.friend_avatar || "" },
				game.score_player1,
				game.score_player2,
				formatDate(game.started_at)
			);
		});
	}

	new Chart(ctx, {
		type: 'bar',
		data: {
		  labels: ['Game', 'Wins', 'Loss', 'Tournaments'],
		  datasets: [{
			label: 'Statistiques',
			data: [
                stats.totalGamesPlayed, // 8
                stats.totalWins,        // 2
                stats.totalLosses,      // 16
                stats.totalTournamentsPlayed // 5
            ],
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
	await fetchAndRender("pong");
	loadPongPageScript();
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
	await fetchAndRender("championship");
	initializeChampionship();
}
