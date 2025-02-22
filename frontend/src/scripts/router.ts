import { loadHomePage, loadLoginPage, loadSignupPage, loadDashboardPage, load2FAPage } from "./loaders/loaders";
import { checkAuth } from "./services/auth.service";

type RouteHandler = () => void | Promise<void>;

const routes: Record<string, RouteHandler> = {
	"/": loadHomePage,
	"/2fa": load2FAPage,
	"/login": async () => {
		(await checkAuth()) ? redirectTo("/dashboard") : await loadLoginPage();
	},
	"/signup": loadSignupPage,
	"/dashboard": async () => {
		(await checkAuth()) ? await loadDashboardPage() : redirectTo("/login");
	},
};

export function handleRouting() {
	const route = routes[window.location.pathname] || loadHomePage;
	route();
}

export function redirectTo(path: string) {
	window.history.pushState({}, "", path);
	handleRouting();
}

window.addEventListener("popstate", handleRouting);