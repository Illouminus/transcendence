import { FriendsList } from "../@types/friends.types";
import { getFriendsListFromDB, sendFriendRequestDB, getIncomingRequestsDb,
    getOutgoingRequestsDb,
 } from "../models/friends.model";



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


// This function should send a friend request from the user with the given userId to the user with the given friendId.
// // If the friend request is successfully sent, return a success message.
// If the friend request is not successfully sent, return an error message.
export async function sendFriendRequestService(userId: number, friendId: number) : Promise<string> {
    try {
     const response = await sendFriendRequestDB(userId, friendId);
     return response;
    } catch (error) {
        throw error;
    } 
}

// This function should return a list of incoming friend requests for the user with the given userId.
export async function getIncomingRequestsService(userId: number) : Promise<Array<FriendsList>> {
    let incomingRequests: Array<FriendsList> = [];
    try {
        incomingRequests = await getIncomingRequestsDb(userId);
        return incomingRequests;
    } catch (error) {
        throw error;
    }
}


// This function should return a list of outgoing friend requests for the user with the given userId.
export async function getOutgoingRequestsService(userId: number) : Promise<Array<FriendsList>> {
    let outgoingRequests: Array<FriendsList> = [];
    try {
        outgoingRequests = await getOutgoingRequestsDb(userId);
        return outgoingRequests;
    } catch (error) {
        throw error;
    }
    return [];
}