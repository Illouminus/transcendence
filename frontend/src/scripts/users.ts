import { UserState } from "./userState";
import { redirectTo } from "./router";
import { createUserRow, generateProfileContainer } from "../components/usersRow";
import { fetchUserProfile } from "./services/user.service";
import { showAlert } from "./services/alert.service";


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
        const response: Response = await fetch('http://localhost:8080/user/friends/requests', {
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
        const viewProfileBtn = target.closest('.view-profile-btn');
        const addFriendBtn = target.closest('.add-friend-btn');
        if (viewProfileBtn) {
            const row = viewProfileBtn.closest('tr');
            const userId = row?.getAttribute('data-user-id');
            if (userId) {
                redirectTo(`/user-profile?id=${userId}`);
            }
        }
        if (addFriendBtn) {
            const row = addFriendBtn.closest('tr');
            const userId = row?.getAttribute('data-user-id');
            if (userId) {
                addFriendBtn.setAttribute('disabled', 'true');
                addFriend(parseInt(userId));
            }
        }
    };

    // Добавляем новый
    usersList.addEventListener('click', usersListClickHandler);
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

        usersList.innerHTML = filtredFriends.map(user => createUserRow(user)).join('');
        attachEventListeners();
    } catch (error) {
        console.error('Error fetching users:', error);
    }
}

// Export necessary functions
export { fetchUsers, addFriend }; 