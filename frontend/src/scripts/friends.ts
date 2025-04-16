import { friendCard } from "../components/friendCard";
import { requestComponent } from "../components/requestList";
import { updateUser } from "./loaders/outils";
import { showAlert } from "./services/alert.service";
import { fetchUserProfile } from "./services/user.service";
import { UserState } from "./userState";



export interface Friend {
    friend_id: number;
    friend_username: string;
    friend_avatar: string;
    status: string;
    online?: boolean;
}


// DOM Elements
let friendsContainer: HTMLElement | null = null;
let requestsContainer: HTMLElement | null = null;

// Initialize DOM elements
const initializeContainers = () => {
    friendsContainer = document.querySelector('.friends-section .grid');
    requestsContainer = document.querySelector('.friend-requests-section .grid');

    if (!friendsContainer || !requestsContainer) {
        console.error('Required containers not found');
        return false;
    }
    return true;
};

// Load and display friends
export const loadFriends = async () => {
    if (!friendsContainer) return;
    
    try {
        const user = UserState.getUser();
        if (!user?.friends) {
            friendsContainer.innerHTML = '<p class="text-gray-400 col-span-3 text-center py-4">No friends yet</p>';
            return;
        }
        
        friendsContainer.innerHTML = '';
        
        const filteredFriends = user.friends.filter(friend => 
            friend.status === 'accepted' || friend.status === 'blocked'
        );
        
        filteredFriends.forEach(friend => {
            const card = createFriendCard(friend);
            friendsContainer?.appendChild(card);
        });

        if (filteredFriends.length === 0) {
            friendsContainer.innerHTML = '<p class="text-gray-400 col-span-3 text-center py-4">No friends yet</p>';
        }
    } catch (error) {
        console.error('Error loading friends:', error);
        showAlert('Failed to load friends', 'danger');
    }
};


export const loadFriendRequests = async () => {
    if (!requestsContainer) return;

    try {
        const user = UserState.getUser();
        if (!user?.incomingRequests) {
            requestsContainer.innerHTML = '<p class="text-gray-400 col-span-3 text-center py-4">No friend requests</p>';
            return;
        }
        requestsContainer.innerHTML = requestComponent(user.incomingRequests);

        if (user.incomingRequests.length === 0) {
            requestsContainer.innerHTML = '<p class="text-gray-400 col-span-3 text-center py-4">No friend requests</p>';
        }
    } catch (error) {
        console.error('Error loading friend requests:', error);
        showAlert('Failed to load friend requests', 'danger');
    }
};

// Create friend card element
const createFriendCard = (friend: Friend): HTMLElement => {
    const card = document.createElement('div');
    card.innerHTML = friendCard(friend);
    return card;
};

// Event handlers
const handleFriendCardClick = async (e: Event) => {
    const target = e.target as HTMLElement;
    const card = target.closest('[data-friend-id]');
    if (!card) return;

    const friendId = card.getAttribute('data-friend-id');
    if (!friendId) return;

    if (target.closest('.game-button')) {
        await inviteToGame(parseInt(friendId), card as HTMLElement);
    } else if (target.closest('.block-button') || target.closest('.unblock-button')) {
        await blockFriend(parseInt(friendId), card as HTMLElement);
    } else if (target.closest('.remove-button')) {
        await removeFriend(parseInt(friendId), card as HTMLElement);
    }
};

const handleFriendRequestClick = async (e: Event) => {
    const target = e.target as HTMLElement;
    const card = target.closest('[data-request-id]');
    if (!card) return;

    const requestId = card.getAttribute('data-request-id');
    if (!requestId) return;

    if (target.closest('.accept-button')) {
        await acceptFriendRequest(parseInt(requestId), card as HTMLElement);
    } else if (target.closest('.reject-button')) {
        await rejectFriendRequest(parseInt(requestId), card as HTMLElement);
    }
};

// Friend actions
const inviteToGame = async (friendId: number, card: HTMLElement) => {
    try {
        const gameSocket = UserState.getGameSocket();
        if (!gameSocket) {
            console.error('Game socket not available');
            showAlert('Game socket not available', 'danger');
            return;
        }
        gameSocket.send(JSON.stringify({ type: 'game_invite', payload: {friendId: friendId}}));
        // const response = await fetch('http://localhost:8080/game/invite', {
        //     method: 'POST',
        //     headers: { 
        //         'Content-Type': 'application/json',
        //         'authorization': `Bearer ${localStorage.getItem('token')}`
        //     },
        //     body: JSON.stringify({ friendId }),
        //     credentials: 'include'
        // });

        //if (!response.ok) throw new Error('Failed to send game invitation');

        const button = card.querySelector('.invite-button');
        if (button) {
            button.textContent = 'Invited!';
            button.classList.add('bg-gray-600', 'cursor-not-allowed');
            button.setAttribute('disabled', 'true');
        }

        showAlert('Game invitation sent!', 'success');
    } catch (error) {
        console.error('Error inviting to game:', error);
        showAlert('Failed to send game invitation', 'danger');
    }
};

const blockFriend = async (friendId: number, card: HTMLElement) => {
    try {
        const isBlocked = card.querySelector('.block-button');
        const url = isBlocked 
            ? `http://localhost:8080/user/friends/${friendId}/block`
            : `http://localhost:8080/user/friends/${friendId}/unblock`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ friendId }),
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Failed to block friend');
        
        //await updateUser();
        UserState.notifyFriendEvent({
            type: isBlocked ? 'friend_blocked' : 'friend_unblocked',
            friendId: friendId
        });
        showAlert(isBlocked ? 'Friend blocked successfully' : 'Friend unblocked successfully', 'success');
    } catch (error) {
        console.error('Error blocking friend:', error);
        showAlert('Failed to block friend', 'danger');
    }
};

const acceptFriendRequest = async (requestId: number, card: HTMLElement) => {
    try {
        const response = await fetch(`http://localhost:8080/user/friends/requests/${requestId}/accept`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestId }),
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Failed to accept friend request');

        await updateUser();
        UserState.notifyFriendEvent({
            type: 'friend_request_accepted',
            friendId: requestId
        });
        
        card.classList.add('opacity-0', 'scale-95');
        setTimeout(() => {
            card.remove();
        }, 300);

        showAlert('Friend request accepted', 'success');
    } catch (error) {
        console.error('Error accepting friend request:', error);
        showAlert('Failed to accept friend request', 'danger');
    }
};

const rejectFriendRequest = async (requestId: number, card: HTMLElement) => {
    try {
        const response = await fetch(`http://localhost:8080/user/friends/requests/${requestId}/reject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestId }),
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Failed to reject friend request');
        
        await updateUser();
        UserState.notifyFriendEvent({
            type: 'friend_request_rejected',
            friendId: requestId
        });
        
        card.classList.add('opacity-0', 'scale-95');
        setTimeout(() => card.remove(), 300);

        showAlert('Friend request rejected', 'success');
    } catch (error) {
        console.error('Error rejecting friend request:', error);
        showAlert('Failed to reject friend request', 'danger');
    }
};

const removeFriend = async (friendId: number, card: HTMLElement) => {
    try {
        const response = await fetch(`http://localhost:8080/user/friends/${friendId}/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ friendId }),
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Failed to remove friend');
        
        await updateUser();
        UserState.notifyFriendEvent({
            type: 'friend_deleted',
            friendId: friendId
        });
        
        card.classList.add('opacity-0', 'scale-95');
        setTimeout(() => card.remove(), 300);
        
        showAlert('Friend removed successfully', 'success');
    } catch (error) {
        console.error('Error removing friend:', error);
        showAlert('Failed to remove friend', 'danger');
    }
};



// Attach event listeners
const attachEventListeners = () => {
    if (!friendsContainer || !requestsContainer) return;

    friendsContainer.addEventListener('click', handleFriendCardClick);
    requestsContainer.addEventListener('click', handleFriendRequestClick);
};

// Main initialization function
export const initializeFriends = async () => {
    if (!initializeContainers()) return;
    
    try {
        await loadFriends();
        await loadFriendRequests();
        attachEventListeners();

        // Subscribe to friend events
        UserState.onFriendEvent((event) => {
            switch (event.type) {
                case 'friend_blocked':
                case 'friend_unblocked':
                case 'friend_deleted':
                case 'friend_added':
                case 'user_unblocked':
                    loadFriends();
                    break;
                case 'incoming_request':
                case 'friend_request_accepted':
                case 'friend_request_rejected':
                    loadFriendRequests();
                    loadFriends();
                    break;
                case 'friend_connected':
                case 'friend_disconnected':
                case 'friend_online':
                    loadFriends();
                    break;
            }
        });

        // Subscribe to connection changes
        UserState.onConnectionChange(() => {
            loadFriends();
        });
    } catch (error) {
        console.error('Error initializing friends manager:', error);
    }
}; 