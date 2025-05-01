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