import { loadPongPage, loadHomePage, loadLoginPage, loadSignupPage, loadSettingsPage, 
	loadProfilePage, load2FAPage, loadUsersPage, loadUserProfilePage, loadFriendsPage, loadGameModePage, loadChampionshipPage, 
	loadLocalPongPage} from "./loaders/loaders";
import { UserState } from "./userState";

type RouteHandler = () => void | Promise<void>;

const routes: Record<string, RouteHandler> = {
	"/": loadHomePage,
	"/2fa": load2FAPage,
	"/pong": loadPongPage,
	"/local-pong": async () => {
		(UserState.isLoggedIn()) ? await loadLocalPongPage() : redirectTo("/login");
	},
	"/login": async () => {
		(UserState.isLoggedIn()) ? redirectTo("/profile") : await loadLoginPage();
	},
	"/signup": loadSignupPage,
	"/profile": async () => {
		(UserState.isLoggedIn()) ? await loadProfilePage() : redirectTo("/login");
	},
	"/settings": async () => {
		(UserState.isLoggedIn()) ? await loadSettingsPage() : redirectTo("/login");
	},
	"/users": async () => {
		(UserState.isLoggedIn()) ? await loadUsersPage() : redirectTo("/login");
	},
	"/user-profile": async () => {
		(UserState.isLoggedIn()) ? await loadUserProfilePage() : redirectTo("/login");
	},
	"/friends": async () => {
		(UserState.isLoggedIn()) ? await loadFriendsPage() : redirectTo("/login");
	},
	"/game-mode": async () => {
		(UserState.isLoggedIn()) ? await loadGameModePage() : redirectTo("/login");
	},
	"/championship": async () => {
		(UserState.isLoggedIn()) ? await loadChampionshipPage() : redirectTo("/login");
	}
};

export function handleRouting() {
	const path = window.location.pathname;
	const handler = routes[path] || loadHomePage;
	handler();
}

export function redirectTo(path: string) {
	if (window.location.pathname === path) {
		return;
	}
	window.history.pushState({}, "", path);
	handleRouting();
}

window.addEventListener("popstate", handleRouting);