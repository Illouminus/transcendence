import { FriendsList } from "../@types/friends.types";
import { getFriendsListFromDB, sendFriendRequestDB, getIncomingRequestsDb,
    getOutgoingRequestsDb, acceptFriendRequestDB, rejectFriendRequestDB, blockFriendDB,
    unblockFriendDb, deleteFriendDb,
    getFriendshipRecord
 } from "../models/friends.model";
import { AppError, ErrorType } from "../utils/errorHandler";



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
export async function sendFriendRequestService(userId: number, friendId: number): Promise<string> {
    // Проверяем, существует ли уже запись о дружбе
    const friendship = await getFriendshipRecord(userId, friendId);
    if (friendship) {
      if (friendship.status === 'pending') {
        throw new AppError("Friend request already sent.", ErrorType.FRIEND_REQUEST_PENDING, 400);
      } else if (friendship.status === 'accepted') {
        throw new AppError("You are already friends.", ErrorType.ALREADY_FRIENDS, 400);
      } else if (friendship.status === 'blocked') {
        throw new AppError("Cannot send friend request – user is blocked.", ErrorType.USER_BLOCKED, 400);
      }
    }
    const response = await sendFriendRequestDB(userId, friendId);
    return response;
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


// This function should accept a friend request from the user with the given userId to the user with the given friendId.
// If the friend request is successfully accepted, return a success message.
// If the friend request is not successfully accepted, return an error message.
export async function acceptFriendRequestService(userId: number, friendId: number) : Promise<string> {
    try {
        const reponse = await acceptFriendRequestDB(userId, friendId);
        return reponse;
    } catch (error) {
        throw error;
    }
}


// This function should reject a friend request from the user with the given userId to the user with the given friendId.
// If the friend request is successfully rejected, return a success message.
// If the friend request is not successfully rejected, return an error message.
export async function rejectFriendRequestService(userId: number, friendId: number) : Promise<string> {
    try {
        const response = await rejectFriendRequestDB(userId, friendId);
        return response;
    } catch (error) {
        throw error;
    }
}

// This function should block a friend with the given friendId for the user with the given userId.
// If the friend is successfully blocked, return a success message.
// If the friend is not successfully blocked, return an error message.
export async function blockFriendService(userId: number, friendId: number) : Promise<string> {
    try {
        const response = await blockFriendDB(userId, friendId);
        return response;
    } catch (error) {
        throw error;
    }
}

// This function should unblock a friend with the given friendId for the user with the given userId.
// If the friend is successfully unblocked, return a success message.
// If the friend is not successfully unblocked, return an error message.
export async function unblockFriendService(userId: number, friendId: number) : Promise<string> {
    try {
        const response = await unblockFriendDb(userId, friendId);
        return response;
    } catch (error) {
        throw error;
    }
}

// This function should delete a friend with the given friendId for the user with the given userId.
// If the friend is successfully deleted, return a success message.
// If the friend is not successfully deleted, return an error message.
export async function deleteFriendService(userId: number, friendId: number) : Promise<string> {
    try {
        const response = await deleteFriendDb(userId, friendId);
        return response;
    } catch (error) {
        throw error;
    }
}