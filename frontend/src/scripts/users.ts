import { UserState } from "./userState";
import { redirectTo } from "./router";
import { createUserRow, generateProfileContainer } from "../components/usersRow";
import { fetchUserProfile } from "./services/user.service";
import { showAlert } from "./services/alert.service";
import { trackedAddEventListener } from "./outils/eventManager";
import { BASE_URL } from "./outils/config";

let unsubscribeConnectionChange: (() => void) | null = null;

export interface UserArray {
    id: number;
    auth_user_id: number;
    avatar_url: string;
    username: string;
    email: string;
    wins: number;
    losses: number;
    created_at: string;
    updated_at: string;
}

// Function to add friend
async function addFriend(userId: number): Promise<void> {
    try {
        const response: Response = await fetch(`${BASE_URL}/user/friends/requests`, {
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify({ userId })  ,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error);
        }

        const data = await response.json();
        showAlert(data.message, 'success');
        const user = await fetchUserProfile();
        if(user)
            UserState.updateUser(user);
        // Add to sent requests
        UserState.addSentFriendRequest(userId);
        
        // Refresh the users list to update the button state
        await fetchUsers();
    } catch (error: any ) {
        console.error('Error adding friend:', error);
        showAlert(error, 'danger');
    }
}

// Function to get URL parameters
function getUrlParameter(name: string): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Function to load user profile data
export async function loadUserProfileData(): Promise<void> {
    const userId = getUrlParameter('id');
    if (!userId) {
        console.error('No user ID provided');
        return;
    }

    try {
        const user = UserState.getAllUsers().find(u => u.id === parseInt(userId));
        if (!user) {
            console.error('User not found');
            return;
        }

        // Update profile page content
        const profileContainer = document.getElementById('profile-container');
        if (profileContainer) {
            profileContainer.innerHTML = generateProfileContainer(user);
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}

let usersListClickHandler: ((e: Event) => void) | null = null;

function attachEventListeners(): void {
    const usersList = document.getElementById('users-list');
    if (!usersList) return;

    if (usersListClickHandler) {
        usersList.removeEventListener('click', usersListClickHandler);
    }

    usersListClickHandler = (event: Event) => {
        const target = event.target as HTMLElement;
        const profileBtn = target.closest('.view-profile-btn') as HTMLElement;
        const addFriendBtn = target.closest('.add-friend-btn') as HTMLElement;
        if (profileBtn) {
            const userId = profileBtn.getAttribute('data-user-id');
            if (userId) {
                redirectTo(`/user-profile?id=${userId}`);
            }
        }
        if (addFriendBtn) {
            const userId = addFriendBtn.getAttribute('data-user-id');
            if (userId) {
                addFriendBtn.setAttribute('disabled', 'true');
                addFriend(parseInt(userId));
            }
        }
    };

    trackedAddEventListener(usersList, 'click', usersListClickHandler);
}

async function fetchUsers(): Promise<void> {
    try {
        const users: UserArray[] = UserState.getAllUsers();
        if (!users || users.length === 0) return;

        const currentUser = UserState.getUser();
        if (!currentUser) {
            console.error('Current user not found');
            return;
        }

        const filteredUsers = users.filter(user => currentUser.id !== user.id);

        // Исключаем пользователей, которые уже являются друзьями
        const acceptedFriendIds = currentUser.friends
            ?.filter(friend => friend.status === 'accepted')
            .map(friend => friend.friend_id) || [];

        const filtredFriends = filteredUsers.filter(user => !acceptedFriendIds.includes(user.id));

        // Обрабатываем исходящие запросы
        const outcomeRequest = currentUser.outgoingRequests || [];
        outcomeRequest.forEach(request => {
            UserState.addSentFriendRequest(request.id);
        });

        // Рендерим список пользователей
        const usersList: HTMLElement | null = document.getElementById('users-list');
        if (!usersList) {
            console.error('Users list element not found');
            return;
        }

        usersList.innerHTML = filtredFriends.map(user => {
            const isFriend = acceptedFriendIds.includes(user.id);
            const isRequestSent = currentUser.outgoingRequests?.some(request => request.id === user.id) || false;
            // we need to check if we have already recieved a request from this user
            const hasReceivedRequest = currentUser.incomingRequests?.some(request => request.id === user.id) || false;
            return createUserRow(user, isFriend, isRequestSent, hasReceivedRequest);
        }).join('');
        attachEventListeners();
    } catch (error) {
        console.error('Error fetching users:', error);
    }
}


export async function initializeUsers(): Promise<() => void> {
	UserState.setCurrentPage("users");

	await fetchUsers();
	const unsubscribe = UserState.onConnectionChange(() => {
		if (UserState.getCurrentPage() === "users") {
			fetchUsers();
		}
	});

	return () => {
		unsubscribe();
	};
}

export function disposeUsers() {
	if (unsubscribeConnectionChange) {
		unsubscribeConnectionChange();
		unsubscribeConnectionChange = null;
	}
}

// Export necessary functions
export { fetchUsers, addFriend };

