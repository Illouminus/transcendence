import { Friend } from "../friends";
import UserState from "../userState";

const BASE_URL = import.meta.env.VITE_BASE_URL;

export const getFriendById = (id : number) : Friend | null => {
    const user = UserState.getUser();
    if (!user || !user.friends) return null;
    return user.friends.find(friend => friend.friend_id === id) || null;
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