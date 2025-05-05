// loaders/loaders.ts

import { loadPongPageScript } from "../pong";
import { fetchAndRender, setUpdateAvatar } from "./outils";
import { loginHandler, renderGoogleButton, login2FA, registerHandler } from "../services/auth.service";
import { GameEvent, UserState } from "../userState";
import { succesSVG, errorSVG } from "./outils";
import { handleUpdateProfile, handleUpdateAvatar, enable2FA, disable2FA } from "../services/user.service";
import { fetchUsers, initializeUsers, loadUserProfileData } from "../users";
import { disposeFriends, initializeFriends } from "../friends";
import { initializeGameModeSelection } from "../gameMode";
import { disposeChampionshipPage, initializeChampionship } from "../championship";
import { disposeGlobalListeners } from "../main";
import { removeAllTrackedEventListeners, trackedAddEventListener } from "../outils/eventManager";
import { c } from "vite/dist/node/moduleRunnerTransport.d-CXw_Ws6P";
import { BASE_URL } from "../outils/config";
import { loadLocalPongPageScript } from "../localPong";
import { waitForElement } from "../outils/outils";

let currentDispose: (() => void) | null = null;
let chartInstance: any | null = null;

let formSubmitHandlers: (() => void)[] = []; // для всех форм


function disposeGoogleButton() {
  const container = document.getElementById("google-signin-button");
  if (container) {
    container.replaceWith(container.cloneNode(false)); // полностью клонируем пустой элемент, обнуляя все события и ссылки
  }
}

function clearAllDisposables() {
  if (currentDispose) {
    currentDispose();
    currentDispose = null;
  }
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
  //disposeGlobalListeners();
  disposeGoogleButton();
  clearFormHandlers();
  removeAllTrackedEventListeners();
}


function clearFormHandlers() {
  formSubmitHandlers.forEach(dispose => dispose());
  formSubmitHandlers = [];
  const form = document.querySelector("form");
  if (form) {
    form.reset();
    form.replaceWith(form.cloneNode(false)); // заново создать пустую форму без событий
  }
}

export async function loadHomePage() {
  clearAllDisposables();
  await fetchAndRender("dog");
}

export async function loadLoginPage() {
  clearAllDisposables();
  await fetchAndRender("login");
  renderGoogleButton();

  const form = document.querySelector("form");
  if (form) {
    const handler = async (e: Event) => {
      e.preventDefault();
      const email = (document.getElementById("email") as HTMLInputElement).value;
      const password = (document.getElementById("password") as HTMLInputElement).value;
      await loginHandler(email, password);
    };
    trackedAddEventListener(form, "submit", handler);
    //form.addEventListener("submit", handler);
    formSubmitHandlers.push(() => form.removeEventListener("submit", handler));
  }
}

export async function loadSignupPage() {
	await fetchAndRender("signup");
	document.querySelector("form")?.addEventListener("submit", registerHandler);
}



export async function fetchStat() {
    try {
        const token = localStorage.getItem('token'); 
        const response = await fetch(`${BASE_URL}/game/gameStats`, {
            headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
            }
        });
		if (!response.ok) throw new Error("Erreur lors de la récupération des stats");

		const stats = await response.json();
		return (stats);
    } catch (error) {
        console.error('Error fetching game statistics:', error);
    }
}


export async function fetchGames() {
    try {
        const token = localStorage.getItem('token'); // ou autre méthode pour récupérer le token
        const response = await fetch(`${BASE_URL}/game/userGames`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
		if (!response.ok) throw new Error("Erreur lors de la récupération des games");

		const games = await response.json();
		return (games);
    } catch (error) {
        console.error('Error fetching games history:', error);
    }
}

export function createGameRow(player1: { username: string, avatar: string }, player2: { username: string, avatar: string }, score1: number, score2: number, date: string, gameType: string) {
  const gamesList = document.getElementById('gamesList');
  if (!gamesList) return;


  const gameRow = document.createElement('div');
  gameRow.className = 'grid grid-cols-12 items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-3 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-600 hover:shadow-md';
  gameRow.innerHTML = `
      <!-- Player 1 -->
      <div class="col-span-4 flex items-center space-x-2">
          <div class="relative group">
              <img src="${BASE_URL}/user${player1.avatar}" alt="${player1.username}" 
                   class="w-10 h-10 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600 transition-transform duration-200 group-hover:scale-110">
          </div>
          <span class="text-gray-900 dark:text-white font-medium truncate">${player1.username}</span>
      </div>
      
      <!-- Score -->
      <div class="col-span-4 flex items-center justify-center">
          <div class="flex items-center space-x-2 bg-gray-200 dark:bg-gray-800 px-4 py-2 rounded-lg">
              <span class="text-2xl font-bold ${score1 > score2 ? 'text-green-500' : 'text-gray-500'}">${score1}</span>
              <span class="text-gray-500 dark:text-gray-400">-</span>
              <span class="text-2xl font-bold ${score2 > score1 ? 'text-green-500' : 'text-gray-500'}">${score2}</span>
          </div>
      </div>
      
      <!-- Player 2 -->
      <div class="col-span-3 flex items-center space-x-2 justify-end">
          <span class="text-gray-900 dark:text-white font-medium truncate">${player2.username}</span>
          <div class="relative group">
              <img src="${BASE_URL}/user${player2.avatar}" alt="${player2.username}" 
                   class="w-10 h-10 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600 transition-transform duration-200 group-hover:scale-110">
          </div>
      </div>

      <!-- Date -->
      <div class="col-span-1 text-sm text-gray-500 dark:text-gray-400 text-right">
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
  clearAllDisposables();
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


  if(!user?.is_google_auth)
  {
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
  } else {
    const verificationStatus = document.getElementById('verificationContainer') as HTMLSpanElement;
    const twoFAContainer = document.getElementById('2faContainer') as HTMLSpanElement;

    verificationStatus.style.display = "none";
    twoFAContainer.style.display = "none";
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
    console.error("Les matchs n'ont pas pu être récupérées.");
    return;
  }
	else {
    games.forEach((game: any) => {
        console.log(games);
        // Déterminer si l'utilisateur actuel est Player1
        const isPlayer1 = user?.id === game.player1_id;
        const opponentId = isPlayer1 ? game.player2_id : game.player1_id;

        // Chercher l'opponent parmi les amis de l'utilisateur
        let opponent = UserState.getAllUsers()?.find(user => user?.id === opponentId);

        // Si le type de jeu est "ai" et l'opponentId est 999999, définir l'opponent comme AI
        if (game.game_type === 'ai' && opponentId === 999999) {
          opponent = {
              id: 999999,
              username: 'The Computer',
              avatar_url: '/images/default_avatar.png', // Vous pouvez ajuster l'URL de l'avatar
              auth_user_id: 999999,
              wins: 0,
              losses: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(), 
              email: 'fakeemail'
          };
      }

        // Définir les scores selon le joueur actuel
        const playerScore = isPlayer1 ? game.score_player1 : game.score_player2;
        const opponentScore = isPlayer1 ? game.score_player2 : game.score_player1;

        // Créer la ligne du jeu avec les informations correctement ordonnées
        createGameRow(
            { username: user?.username ?? 'inconnu', avatar: user?.avatar || "" },
            { username: opponent?.username ?? 'inconnu', avatar: opponent?.avatar_url || "" },
            playerScore,
            opponentScore,
            formatDate(game.started_at), 
            game.game_type
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
  clearAllDisposables();
  await fetchAndRender("2fa");

  const form = document.querySelector("form");
  if (form) {
    const handler = async (e: Event) => {
      e.preventDefault();
      const code = (document.getElementById("code") as HTMLInputElement).value;
      const email = UserState.getTempEmail();
      await login2FA(email, code);
    };
    trackedAddEventListener(form, "submit", handler);
    //form.addEventListener("submit", handler);
    formSubmitHandlers.push(() => form.removeEventListener("submit", handler));
  }
}

export async function loadSettingsPage() {
  clearAllDisposables();
  await fetchAndRender("settings");

  const avatarForm = document.querySelector("#update-avatar-form");

  if(UserState.getUser()?.is_google_auth) {
    const twoFALable = document.getElementById("2faLabel") as HTMLLabelElement;
    const passwordInput = document.getElementById("password-div") as HTMLInputElement;

    // and we need to hide the password input and 2fa label
  
    twoFALable.style.display = "none";
    passwordInput.style.display = "none";
  }


  if (avatarForm) {
    trackedAddEventListener(avatarForm, "submit", handleUpdateAvatar);
    //avatarForm.addEventListener("submit", handleUpdateAvatar);
    formSubmitHandlers.push(() => avatarForm.removeEventListener("submit", handleUpdateAvatar));
  }

  const profileForm = document.querySelector("#profile-edit-form");
  if (profileForm) {
    trackedAddEventListener(profileForm, "submit", handleUpdateProfile);
    //profileForm.addEventListener("submit", handleUpdateProfile);
    formSubmitHandlers.push(() => profileForm.removeEventListener("submit", handleUpdateProfile));
  }

  const faInput = document.getElementById("2faInput") as HTMLInputElement;
  if (faInput) {
    const handler = async () => {
      if (faInput.checked) await enable2FA();
      else await disable2FA();
      loadSettingsPage();
    };
    trackedAddEventListener(faInput, "change", handler);
    //faInput.addEventListener("change", handler);
    formSubmitHandlers.push(() => faInput.removeEventListener("change", handler));
  }

  const user = UserState.getUser();
  if (user) {
    (document.getElementById("profile-username") as HTMLInputElement).innerText = user.username ?? "";
    (document.getElementById("username") as HTMLInputElement).value = user.username ?? "";
    (document.getElementById("profile-email") as HTMLInputElement).value = user.email ?? "";
  }

  await setUpdateAvatar();
}



export async function loadPongPage() {
  clearAllDisposables();
  await fetchAndRender("pong");
  currentDispose = await loadPongPageScript();
}

export async function loadLocalPongPage() {
  clearAllDisposables();
  await fetchAndRender("local-pong");
  currentDispose = await loadLocalPongPageScript();
}


export async function loadFriendsPage() {
  clearAllDisposables();
  await fetchAndRender("friends");
  await initializeFriends();
  currentDispose = disposeFriends;
}

export async function loadGameModePage() {
  clearAllDisposables();
  await fetchAndRender("game-mode");
  initializeGameModeSelection();
}

export async function loadChampionshipPage() {
  clearAllDisposables();
  await fetchAndRender("championship");
  initializeChampionship();
  currentDispose = disposeChampionshipPage;
}

export async function loadUsersPage() {
	clearAllDisposables();
	await fetchAndRender("users");
	currentDispose = await initializeUsers();
}

export async function loadUserProfilePage() {
  clearAllDisposables();
  await fetchAndRender("user-profile");
  await loadUserProfileData();
}
