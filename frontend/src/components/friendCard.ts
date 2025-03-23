import { Friend } from "../scripts/friends";


export const friendCard = (friend: Friend) => {
    const statusColor = friend.status === 'blocked' ? 'bg-red-500' : 'bg-green-500';
    const userIsBlocked = friend.status === 'blocked';


    return `
<div class="w-full max-w-sm bg-white/5 backdrop-blur-md border border-gray-200/10 rounded-xl shadow-lg dark:bg-gray-800/50 dark:border-gray-700/50 hover:bg-gray-800/70 transition-all duration-300 ${userIsBlocked ? 'opacity-80' : ''}" data-friend-id="${friend.friend_id}">
    <div class="flex flex-col items-center justify-center p-4">
        <div class="relative group">
            <div class="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-0 group-hover:opacity-50 transition duration-500 blur"></div>
            <img class="relative w-24 h-24 rounded-full shadow-lg object-cover ring-2 ring-gray-700/50 ${userIsBlocked ? 'grayscale' : ''}" src="http://localhost:8080/user${friend.friend_avatar}" alt="${friend.friend_username}'s avatar"/>
            <span class="absolute bottom-1 right-1 w-4 h-4 rounded-full ${statusColor} border-2 border-gray-800 shadow-lg"></span>
        </div>
        <h5 class="mt-4 text-xl font-medium text-white group-hover:text-blue-400 transition-colors ${userIsBlocked ? 'text-gray-400' : ''}">${friend.friend_username}</h5>
        <div class="flex mt-6 space-x-2">

            <div class="group/tooltip relative ${userIsBlocked ? 'hidden' : 'block'}">
                <button class="game-button inline-flex items-center p-2 text-sm font-medium text-center text-white bg-gray-800/70 border border-gray-600/30 rounded-lg hover:bg-blue-500/30 hover:border-blue-500/50 focus:ring-2 focus:outline-none focus:ring-blue-500/50 transition-all duration-200 backdrop-blur-sm group">
                    <svg class="w-5 h-5 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 6l-8 8m0-8l8 8m2-4h3a2 2 0 012 2v6a2 2 0 01-2 2h-3M3 12h.01M7 12h.01M11 12h.01M15 12h.01"/>
                    </svg>
                </button>
                <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200">
                    Invite to Pong Game
                    <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                </div>
            </div>

            <div class="group/tooltip relative">
                <button class="${userIsBlocked ? 'unblock' : 'block'}-button inline-flex items-center p-2 text-sm font-medium text-center text-white bg-gray-800/70 border border-gray-600/30 rounded-lg hover:bg-yellow-500/30 hover:border-yellow-500/50 focus:ring-2 focus:outline-none focus:ring-yellow-500/50 transition-all duration-200 backdrop-blur-sm group">
                    <svg class="w-5 h-5 ${userIsBlocked ? 'text-red-400 group-hover:text-red-300' : 'group-hover:text-yellow-400'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        ${userIsBlocked ? `
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                        ` : `
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" fill="currentColor"/>
                        `}
                    </svg>
                </button>
                <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200">
                    ${userIsBlocked ? 'Unblock User' : 'Block User'}
                    <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                </div>
            </div>

            <div class="group/tooltip relative">
                <button class="remove-button inline-flex items-center p-2 text-sm font-medium text-center text-white bg-gray-800/70 border border-gray-600/30 rounded-lg hover:bg-red-500/30 hover:border-red-500/50 focus:ring-2 focus:outline-none focus:ring-red-500/50 transition-all duration-200 backdrop-blur-sm group">
                    <svg class="w-5 h-5 group-hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
                <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200">
                    Remove Friend
                    <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                </div>
            </div>
        </div>
    </div>
</div>
`;
}