import { fetchAndRender } from "./loaders/outils";
import { UserState } from "./userState";
import { redirectTo } from "./router";

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
    const hasSentRequest = UserState.hasSentFriendRequest(user.id);
    const buttonClass = hasSentRequest 
        ? "text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300" 
        : "text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300";
    const buttonTitle = hasSentRequest ? "Friend Request Pending" : "Add Friend";
    const buttonIcon = hasSentRequest 
        ? `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />`
        : `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />`;

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
                <button class="view-profile-btn text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3" title="View Profile">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </button>
                <button class="add-friend-btn ${buttonClass}" title="${buttonTitle}">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        ${buttonIcon}
                    </svg>
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
                        <button class="view-profile-btn flex-1 p-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" title="View Profile">
                            <svg class="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </button>
                        <button class="add-friend-btn flex-1 p-2 text-sm font-medium text-white ${hasSentRequest ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'} rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${hasSentRequest ? 'yellow' : 'green'}-500" title="${buttonTitle}">
                            <svg class="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                ${buttonIcon}
                            </svg>
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
        const response: Response = await fetch('http://localhost:8080/user/friends/requests', {
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify({ userId })  ,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to add friend');
        }

        // Add to sent requests
        UserState.addSentFriendRequest(userId);
        
        // Refresh the users list to update the button state
        await fetchUsers();
        
        alert('Friend request sent successfully!');
    } catch (error) {
        console.error('Error adding friend:', error);
        alert('Failed to send friend request');
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
            profileContainer.innerHTML = `
                <div class="w-full md:w-1/3 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div class="flex flex-col items-center text-center">
                        <img class="w-24 h-24 rounded-full object-cover mb-4 border-2 border-blue-400"
                            src="http://localhost:8080/user${user.avatar_url}" alt="User avatar" />
                        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            ${user.username}
                        </h2>
                        <div class="w-full mt-4 text-gray-800 dark:text-gray-200">
                            <div class="flex justify-between my-2">
                                <span>Email</span>
                                <span class="font-semibold">${user.email}</span>
                            </div>
                            <div class="flex justify-between my-2">
                                <span>Wins</span>
                                <span class="font-semibold">${user.wins}</span>
                            </div>
                            <div class="flex justify-between my-2">
                                <span>Losses</span>
                                <span class="font-semibold">${user.losses}</span>
                            </div>
                            <div class="flex justify-between my-2">
                                <span>Member since</span>
                                <span class="font-semibold">${new Date(user.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
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
                redirectTo(`/user-profile?id=${userId}`);
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
        const outcomeRequest = UserState.getUser()?.outgoingRequests;
        if(outcomeRequest)
        outcomeRequest.forEach(request => {
            UserState.addSentFriendRequest(request.id);
        });
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