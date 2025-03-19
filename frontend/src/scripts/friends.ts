import { friendCard } from "../components/friendCard";
import { requestComponent } from "../components/requestList";
import { UserState } from "./userState";

interface Friend {
    id: number;
    username: string;
    avatar: string;
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
            
            this.friendsContainer.innerHTML = '';
            user.friends.forEach(friend => {
                const card = this.createFriendCard(friend);
                this.friendsContainer?.appendChild(card);
            });

            if (user.friends.length === 0) {
                this.friendsContainer.innerHTML = '<p class="text-gray-400 col-span-3 text-center py-4">No friends yet</p>';
            }
        } catch (error) {
            console.error('Error loading friends:', error);
            this.showNotification('Failed to load friends', 'error');
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
            this.showNotification('Failed to load friend requests', 'error');
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
                headers: { 'Content-Type': 'application/json' },
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

            this.showNotification('Game invitation sent!', 'success');
        } catch (error) {
            console.error('Error inviting to game:', error);
            this.showNotification('Failed to send game invitation', 'error');
        }
    }

    private async blockFriend(friendId: number, card: HTMLElement) {
        try {
            const response = await fetch('http://localhost:8080/friends/block', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ friendId }),
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to block friend');

            card.classList.add('opacity-0', 'scale-95');
            setTimeout(() => card.remove(), 300);

            this.showNotification('Friend blocked successfully', 'success');
        } catch (error) {
            console.error('Error blocking friend:', error);
            this.showNotification('Failed to block friend', 'error');
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

            card.classList.add('opacity-0', 'scale-95');
            setTimeout(() => {
                card.remove();
                this.loadFriends();
            }, 300);

            this.showNotification('Friend request accepted!', 'success');
        } catch (error) {
            console.error('Error accepting friend request:', error);
            this.showNotification('Failed to accept friend request', 'error');
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

            card.classList.add('opacity-0', 'scale-95');
            setTimeout(() => card.remove(), 300);

            this.showNotification('Friend request rejected', 'success');
        } catch (error) {
            console.error('Error rejecting friend request:', error);
            this.showNotification('Failed to reject friend request', 'error');
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

            card.classList.add('opacity-0', 'scale-95');
            setTimeout(() => card.remove(), 300);

            this.showNotification('Friend removed successfully', 'success');
        } catch (error) {
            console.error('Error removing friend:', error);
            this.showNotification('Failed to remove friend', 'error');
        }
    }

    private showNotification(message: string, type: 'success' | 'error') {
        const container = document.getElementById('alert-container');
        if (!container) return;

        const alert = document.createElement('div');
        alert.className = `p-4 mb-4 rounded-lg ${
            type === 'success' ? 'bg-green-800 text-green-200' : 'bg-red-800 text-red-200'
        } transition-all transform translate-y-0 opacity-100`;
        alert.textContent = message;

        container.appendChild(alert);

        setTimeout(() => {
            alert.classList.add('opacity-0', 'translate-y-2');
            setTimeout(() => alert.remove(), 300);
        }, 3000);
    }
}

// Initialize the friends manager when the page content is loaded
export function initializeFriends() {
    const friendsManager = new FriendsManager();
    friendsManager.initialize();
} 