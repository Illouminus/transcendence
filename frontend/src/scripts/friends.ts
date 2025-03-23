import { friendCard } from "../components/friendCard";
import { requestComponent } from "../components/requestList";
import { showAlert } from "./services/alert.service";
import { fetchUserProfile } from "./services/user.service";
import { UserState } from "./userState";

export interface Friend {
    friend_id: number;
    friend_username: string;
    friend_avatar: string;
    status: string;
}

class FriendsManager {
    private friendsContainer: HTMLElement | null;
    private requestsContainer: HTMLElement | null;

    constructor() {
        this.friendsContainer = null;
        this.requestsContainer = null;
    }

    async initialize() {
        this.friendsContainer = document.querySelector('.friends-section .grid');
        this.requestsContainer = document.querySelector('.friend-requests-section .grid');

        if (!this.friendsContainer || !this.requestsContainer) {
            console.error('Required containers not found');
            return;
        }
        try {
            await this.loadFriends();
            await this.loadFriendRequests();
            this.attachEventListeners();
        } catch (error) {
            console.error('Error initializing friends manager:', error);
        }
    }

    private async loadFriends() {
        if (!this.friendsContainer) return;
        try {
            const user = UserState.getUser();
            if (!user?.friends) {
                this.friendsContainer.innerHTML = '<p class="text-gray-400 col-span-3 text-center py-4">No friends yet</p>';
                return;
            }
            
            console.log("User friends", user.friends)

            this.friendsContainer.innerHTML = '';
            user.friends = user.friends.filter(friend => friend.status === 'accepted');
            user.friends.forEach(friend => {
                const card = this.createFriendCard(friend);
                console.log("Card", card)
                this.friendsContainer?.appendChild(card);
            });

            if (user.friends.length === 0) {
                this.friendsContainer.innerHTML = '<p class="text-gray-400 col-span-3 text-center py-4">No friends yet</p>';
            }
        } catch (error) {
            console.error('Error loading friends:', error);
            showAlert('Failed to load friends', 'danger');
        }
    }

    private async loadFriendRequests() {
        if (!this.requestsContainer) return;

        try {
            const user = UserState.getUser();
            if (!user?.incomingRequests) {
                this.requestsContainer.innerHTML = '<p class="text-gray-400 col-span-3 text-center py-4">No friend requests</p>';
                return;
            }

            // Используем новый компонент requestList
            this.requestsContainer.innerHTML = requestComponent(user.incomingRequests);

            if (user.incomingRequests.length === 0) {
                this.requestsContainer.innerHTML = '<p class="text-gray-400 col-span-3 text-center py-4">No friend requests</p>';
            }
        } catch (error) {
            console.error('Error loading friend requests:', error);
            showAlert('Failed to load friend requests', 'danger');
        }
    }

    private createFriendCard(friend: Friend): HTMLElement {
        const card = document.createElement('div');
        card.innerHTML = friendCard(friend);
        return card;
    }

    private attachEventListeners() {
        if (!this.friendsContainer || !this.requestsContainer) return;

        // Friend card event listeners
        this.friendsContainer.addEventListener('click', async (e) => {
            const target = e.target as HTMLElement;
            const card = target.closest('[data-friend-id]');
            if (!card) return;

            const friendId = card.getAttribute('data-friend-id');
            if (!friendId) return;

            if (target.closest('.game-button')) {
                await this.inviteToGame(parseInt(friendId), card as HTMLElement);
            } else if (target.closest('.block-button') || target.closest('.unblock-button')) {
                await this.blockFriend(parseInt(friendId), card as HTMLElement);
            } else if (target.closest('.remove-button')) {
                await this.removeFriend(parseInt(friendId), card as HTMLElement);
            }
        });

        // Friend request event listeners
        this.requestsContainer.addEventListener('click', async (e) => {
            const target = e.target as HTMLElement;
            const card = target.closest('[data-request-id]');
            if (!card) return;

            const requestId = card.getAttribute('data-request-id');
            if (!requestId) return;

            if (target.closest('.accept-button')) {
                await this.acceptFriendRequest(parseInt(requestId), card as HTMLElement);
            } else if (target.closest('.reject-button')) {
                await this.rejectFriendRequest(parseInt(requestId), card as HTMLElement);
            }
        });
    }

    private async inviteToGame(friendId: number, card: HTMLElement) {
        try {
            const response = await fetch('http://localhost:8080/game/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' ,
                    'authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ friendId }),
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to send game invitation');

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
    }

    private async blockFriend(friendId: number, card: HTMLElement) {
        try {
            let url = '';
            if(card.querySelector('.block-button')){
                url = `http://localhost:8080/user/friends/${friendId}/block`;
            }
            else {
                url = `http://localhost:8080/user/friends/${friendId}/unblock`;
            }
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ friendId }),
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to block friend');
            await this.updateUser();
            await this.loadFriends();

            showAlert('Friend blocked successfully', 'success');
        } catch (error) {
            console.error('Error blocking friend:', error);
            showAlert('Failed to block friend', 'danger');
        }
    }

    private async acceptFriendRequest(requestId: number, card: HTMLElement) {
        try {
            const response = await fetch(`http://localhost:8080/user/friends/requests/${requestId}/accept`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId }),
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to accept friend request');

            await this.updateUser();
            console.log("User friends", UserState.getUser()?.friends)
            card.classList.add('opacity-0', 'scale-95');

            setTimeout(() => {
                card.remove();
                this.loadFriends();
            }, 300);

            showAlert('Friend request accepted', 'success');
        } catch (error) {
            console.error('Error accepting friend request:', error);
           showAlert('Failed to accept friend request', 'danger');
        }
    }

    private async rejectFriendRequest(requestId: number, card: HTMLElement) {
        try {
            const response = await fetch('http://localhost:8080/friends/reject', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId }),
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to reject friend request');
            
            await this.updateUser();
            card.classList.add('opacity-0', 'scale-95');
            setTimeout(() => card.remove(), 300);

            showAlert('Friend request rejected', 'success');
        } catch (error) {
            console.error('Error rejecting friend request:', error);
            showAlert('Failed to reject friend request', 'danger');
        }
    }

    private async removeFriend(friendId: number, card: HTMLElement) {
        try {
            const response = await fetch(`http://localhost:8080/user/friends/${friendId}/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ friendId }),
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to remove friend');
            await this.updateUser();
            card.classList.add('opacity-0', 'scale-95');
            setTimeout(() => card.remove(), 300);
            showAlert('Friend removed successfully', 'success');
        } catch (error) {
            console.error('Error removing friend:', error);
            showAlert('Failed to remove friend', 'danger');
        }
    }


    private async updateUser() {
        try {
            const user = await fetchUserProfile();
            if (user) {
                UserState.setUser(user);
            }
        } catch (error) {
            console.error('Error updating user:', error);
        }
    }
}

// Initialize the friends manager when the page content is loaded
export function initializeFriends() {
    const friendsManager = new FriendsManager();
    friendsManager.initialize();
} 