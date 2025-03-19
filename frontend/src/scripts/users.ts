import { fetchAndRender } from "./loaders/outils";
import { UserState } from "./userState";

interface UserArray {
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

const API_URL_USER: string = "http://localhost:8080/user/getAllUsers";

function createUserRow(user: UserArray): string {
    return `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700" data-user-id="${user.id}">
            <!-- Desktop View -->
            <td class="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                        <img class="h-10 w-10 rounded-full" src=${`http://localhost:8080/user${user.avatar_url}`} alt="">
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900 dark:text-white">
                            ${user.username}
                        </div>
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                            ${user.email}
                        </div>
                    </div>
                </div>
            </td>
            <td class="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-white">
                    Wins: ${user.wins} | Losses: ${user.losses}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                    Member since: ${new Date(user.created_at).toLocaleDateString()}
                </div>
            </td>
            <td class="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                <button class="view-profile-btn text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3">
                    View Profile
                </button>
                <button class="add-friend-btn text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">
                    Add Friend
                </button>
            </td>

            <!-- Mobile View -->
            <td class="md:hidden px-4 py-4">
                <div class="flex flex-col space-y-4">
                    <div class="flex items-center space-x-4">
                        <div class="flex-shrink-0 h-12 w-12">
                            <img class="h-12 w-12 rounded-full" src=${`http://localhost:8080/user${user.avatar_url}`} alt="">
                        </div>
                        <div>
                            <div class="text-base font-medium text-gray-900 dark:text-white">
                                ${user.username}
                            </div>
                            <div class="text-sm text-gray-500 dark:text-gray-400">
                                ${user.email}
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex flex-col space-y-2">
                        <div class="text-sm text-gray-900 dark:text-white">
                            <span class="font-medium">Wins:</span> ${user.wins}
                        </div>
                        <div class="text-sm text-gray-900 dark:text-white">
                            <span class="font-medium">Losses:</span> ${user.losses}
                        </div>
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                            <span class="font-medium">Member since:</span> ${new Date(user.created_at).toLocaleDateString()}
                        </div>
                    </div>

                    <div class="flex space-x-4 pt-2">
                        <button class="view-profile-btn flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            View Profile
                        </button>
                        <button class="add-friend-btn flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                            Add Friend
                        </button>
                    </div>
                </div>
            </td>
        </tr>
    `;
}

// Function to add friend
async function addFriend(userId: number): Promise<void> {
    try {
        const response: Response = await fetch('http://localhost:8080/friends/add', {
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify({ friendId: userId })
        });

        if (!response.ok) {
            throw new Error('Failed to add friend');
        }
        alert('Friend request sent successfully!');
    } catch (error) {
        console.error('Error adding friend:', error);
        alert('Failed to send friend request');
    }
}

function attachEventListeners(): void {
    const usersList = document.getElementById('users-list');
    if (!usersList) return;

    usersList.addEventListener('click', (event: Event) => {
        const target = event.target as HTMLElement;
        const viewProfileBtn = target.closest('.view-profile-btn');
        if (viewProfileBtn) {
            const row = viewProfileBtn.closest('tr');
            const userId = row?.getAttribute('data-user-id');
            if (userId) {
                window.location.href = `/profile.html?id=${userId}`;
            }
        }
    });

    // Handle add friend clicks
    usersList.addEventListener('click', (event: Event) => {
        const target = event.target as HTMLElement;
        const addFriendBtn = target.closest('.add-friend-btn');
        if (addFriendBtn) {
            const row = addFriendBtn.closest('tr');
            const userId = row?.getAttribute('data-user-id');
            if (userId) {
                addFriend(parseInt(userId));
            }
        }
    });
}

// Function to fetch and display users
async function fetchUsers(): Promise<void> {
    try {  
        const users: UserArray[] = UserState.getAllUsers(); 
        const usersList: HTMLElement | null = document.getElementById('users-list');
        if (!usersList) {
            console.error('Users list element not found');
            return;
        }
        usersList.innerHTML = users.map(user => createUserRow(user)).join('');
        attachEventListeners();
    } catch (error) {
        console.error('Error fetching users:', error);
    }
}

// Export necessary functions
export { fetchUsers, addFriend, UserArray }; 