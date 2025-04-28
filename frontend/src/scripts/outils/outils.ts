import { Friend } from "../friends";
import UserState from "../userState";



export const getFriendById = (id : number) : Friend | null => {
    const user = UserState.getUser();
    if (!user || !user.friends) return null;
    return user.friends.find(friend => friend.friend_id === id) || null;
}