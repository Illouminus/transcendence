import { redirectTo } from "../router";
import { logout } from "./auth.service";
import { setupUI } from "./ui.service";


export async function onSignupClick() {
	redirectTo("/signup");
}
export async function onLoginClick() {
	redirectTo("/login");
}
export async function onLogoutClick() {
	await logout();
	await setupUI();
	redirectTo("/");
}
export async function onLogoClick() {
	redirectTo("/");
}
export async function onProfileClick() {
	redirectTo("/profile");
}

export async function onPongClick() {
	redirectTo("/pong");
}

export async function onSettingsClick() {
	redirectTo("/settings");
}

export async function onUsersClick() {
	redirectTo("/users");
}

export async function onFriendsClick() {
	redirectTo("/friends");
}