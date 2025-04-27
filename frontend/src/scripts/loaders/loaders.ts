// loaders/loaders.ts

import { loadPongPageScript } from "../pong";
import { fetchAndRender, setUpdateAvatar } from "./outils";
import { loginHandler, renderGoogleButton, login2FA, registerHandler } from "../services/auth.service";
import { GameEvent, UserState } from "../userState";
import { succesSVG, errorSVG } from "./outils";
import { handleUpdateProfile, handleUpdateAvatar, enable2FA, disable2FA } from "../services/user.service";
import { fetchUsers, loadUserProfileData } from "../users";
import { disposeFriends, initializeFriends } from "../friends";
import { initializeGameModeSelection } from "../gameMode";
import { disposeChampionshipPage, initializeChampionship } from "../championship";
import { disposeGlobalListeners } from "../main";
import { removeAllTrackedEventListeners, trackedAddEventListener } from "../outils/eventManager";

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
  clearAllDisposables();
  await fetchAndRender("signup");

  const form = document.querySelector("form");
  if (form) {
    trackedAddEventListener(form, "submit", registerHandler);
    //form.addEventListener("submit", registerHandler);
    formSubmitHandlers.push(() => form.removeEventListener("submit", registerHandler));
  }
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

export async function loadProfilePage() {
  clearAllDisposables();
  if(chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  await fetchAndRender("profile");
  await setUpdateAvatar();

  const user = UserState.getUser();
  if (user) {
    (document.getElementById("profile-username") as HTMLElement).innerText = user.username ?? "";
    (document.getElementById("verification-status") as HTMLElement).innerHTML = user.is_verified ? succesSVG : errorSVG;
    (document.getElementById("2fa-enabled") as HTMLElement).innerHTML = user.two_factor_enabled ? succesSVG : errorSVG;
    (document.getElementById("online-user") as HTMLElement).innerHTML = succesSVG;
  }

  const ctx = document.getElementById("myChart") as HTMLCanvasElement;
  chartInstance = new Chart(ctx, {
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

export async function loadPongPage() {
  clearAllDisposables();
  await fetchAndRender("pong");
  currentDispose = await loadPongPageScript();
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
  await fetchUsers();
}

export async function loadUserProfilePage() {
  clearAllDisposables();
  await fetchAndRender("user-profile");
  await loadUserProfileData();
}
