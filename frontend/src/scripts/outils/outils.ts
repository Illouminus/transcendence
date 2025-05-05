import { Friend } from "../friends";
import { UserArray } from "../users";
import UserState from "../userState";

const BASE_URL = import.meta.env.VITE_BASE_URL;

export const getUserById = (id : number) : UserArray | null => {
    const allUsers = UserState.getAllUsers();
	const user = allUsers.find((user) => user.id === id);
	if (!user) {
		return null;
	}
	return user;
}



export function api(path: string, options: RequestInit = {}) {
  return fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    ...options
  });
}


export function waitForElement(selector: string, timeout = 3000): Promise<Element> {
	return new Promise((resolve, reject) => {
		const el = document.querySelector(selector);
		if (el) return resolve(el);

		const observer = new MutationObserver(() => {
			const el = document.querySelector(selector);
			if (el) {
				observer.disconnect();
				resolve(el);
			}
		});

		observer.observe(document.body, { childList: true, subtree: true });

		setTimeout(() => {
			observer.disconnect();
			reject(new Error(`Element ${selector} not found within ${timeout}ms`));
		}, timeout);
	});
}


export function verifyTournamentStateAndUserIn(): boolean {
	const user = UserState.getUser();
	const tournament = UserState.getTournamentState();
	if (!user || !tournament) {
		return false;
	}
	if(tournament.players.find((player) => player.id === user.id))
		return true;
	else
		return false;
}