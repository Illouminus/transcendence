import { loadHomePage, loadLoginPage, loadSignupPage, loadProfilePage, load2FAPage, loadSettingsPage } from "./loaders/loaders";
import { checkAuth } from "./services/auth.service";
import { UserState } from "./userState";

type RouteHandler = () => void | Promise<void>;

const routes: Record<string, RouteHandler> = {
	"/": loadHomePage,
	"/2fa": load2FAPage,
	"/login": async () => {
		(UserState.isLoggedIn()) ? redirectTo("/profile") : await loadLoginPage();
	},
	"/signup": loadSignupPage,
	"/profile": async () => {
		(UserState.isLoggedIn()) ? await loadProfilePage() : redirectTo("/login");
	},
	"/settings": async () => {
		(UserState.isLoggedIn()) ? await loadSettingsPage() : redirectTo("/login");
	}
};

export function handleRouting() {
	const route = routes[window.location.pathname] || loadHomePage;
	route();
}

export function redirectTo(path: string) {
	if (window.location.pathname === path) {
		return;
	}
	window.history.pushState({}, "", path);
	handleRouting();
}

window.addEventListener("popstate", handleRouting);