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

    // Удаляем старый обработчик если есть
    if (usersListClickHandler) {
        usersList.removeEventListener('click', usersListClickHandler);
    }

    // Создаем новый обработчик
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

        // Исключаем текущего пользователя
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
            const isRequestSent = UserState.hasSentFriendRequest(user.id);
            return createUserRow(user, isFriend, isRequestSent);
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

// Новый современный UI для профиля пользователя
export function generateProfileContainer(user: UserArray): string {
    return `
        <div class="flex flex-col md:flex-row items-center w-full">
            <div class="flex-shrink-0 w-40 h-40 rounded-2xl overflow-hidden bg-gray-800 shadow-lg flex items-center justify-center">
                <img src="${BASE_URL + "/user" + user.avatar_url || '/images/default_avatar.png'}" alt="${user.username}" class="object-cover w-full h-full" />
            </div>
            <div class="flex-1 mt-6 md:mt-0 md:ml-10 text-white">
                <h2 class="text-3xl font-bold mb-2">${user.username}</h2>
                <div class="mb-4 text-gray-400">ID: <span class="text-gray-200">${user.id}</span></div>
                <div class="mb-2 flex flex-wrap gap-4">
                    <div class="bg-gray-800/80 rounded-lg px-4 py-2 text-lg font-semibold">Wins: <span class="text-green-400">${user.wins}</span></div>
                    <div class="bg-gray-800/80 rounded-lg px-4 py-2 text-lg font-semibold">Losses: <span class="text-red-400">${user.losses}</span></div>
                </div>
                <div class="mt-4 text-gray-400 text-sm">Email: <span class="text-gray-200">${user.email}</span></div>
                <div class="mt-2 text-gray-400 text-sm">Joined: <span class="text-gray-200">${new Date(user.created_at).toLocaleDateString()}</span></div>
            </div>
        </div>
    `;
}

// Новый современный UI для карточки пользователя
export function createUserRow(user: UserArray, isFriend: boolean, isRequestSent: boolean): string {
    const addDisabled = isFriend || isRequestSent;
    const addText = isFriend
        ? "Already Friend"
        : isRequestSent
            ? "Request Sent"
            : "Add Friend";
    return `
        <div class="flex items-center justify-between bg-gray-900/80 rounded-2xl shadow-lg p-6 w-full backdrop-blur-md">
            <div class="flex items-center gap-5">
                <div class="w-16 h-16 rounded-xl overflow-hidden bg-gray-800 flex items-center justify-center">
                    <img src="${BASE_URL + "/user" + user.avatar_url || '/images/default_avatar.png'}" alt="${user.username}" class="object-cover w-full h-full" />
                </div>
                <div>
                    <div class="text-xl font-bold text-white mb-1">${user.username}</div>
                    <div class="text-sm text-gray-400">ID: ${user.id}</div>
                </div>
            </div>
            <div class="flex items-center gap-4">
                <span class="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-gray-800/70 text-gray-300">Wins: <span class="text-green-400">${user.wins}</span></span>
                <span class="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-gray-800/70 text-gray-300">Losses: <span class="text-red-400">${user.losses}</span></span>
                <button class="view-profile-btn bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition" data-user-id="${user.id}">Profile</button>
                <button class="add-friend-btn bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition ${addDisabled ? 'opacity-50 cursor-not-allowed' : ''}" data-user-id="${user.id}" ${addDisabled ? 'disabled' : ''}>${addText}</button>
            </div>
        </div>
    `;
} 