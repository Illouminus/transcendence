import { loadHomePage, loadLoginPage, loadSignupPage, loadProfilePage, load2FAPage, loadPongPage } from "./loaders/loaders";
import { checkAuth } from "./services/auth.service";

type RouteHandler = () => void | Promise<void>;

const routes: Record<string, RouteHandler> = {
	"/": loadHomePage,
	"/2fa": load2FAPage,
	"/pong": loadPongPage, 
	"/login": async () => {
		(await checkAuth()) ? redirectTo("/profile") : await loadLoginPage();
	},
	"/signup": loadSignupPage,
	"/profile": async () => {
		(await checkAuth()) ? await loadProfilePage() : redirectTo("/login");
	},
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