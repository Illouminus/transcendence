import { BASE_URL } from "../scripts/outils/config";
import { UserArray } from "../scripts/users";
import { UserState } from "../scripts/userState";



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
export function createUserRow(user: UserArray, isFriend: boolean, isRequestSent: boolean, hasReceivedRequest: boolean): string {
    const addDisabled = isFriend || isRequestSent || hasReceivedRequest;
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