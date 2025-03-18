import { FriendsList } from "../@types/friends.types";
import { getFriendsListFromDB } from "../models/friends.model";



// This function should return a list of friends of the user with the given userId.
export async function getFriendsListService(userId: number) : Promise<Array<FriendsList>> {
    let friendsList: Array<FriendsList> = [];
    try {
        friendsList = await getFriendsListFromDB(userId);
        return friendsList;
    } catch (error) {
        throw error;
    }
    return [];
}