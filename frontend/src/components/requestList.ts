interface FriendRequest {
    id: number;
    username: string;
    avatar: string;
}

const requestCard = (request: FriendRequest) => {
    return `
    <div class="w-full bg-white/5 backdrop-blur-md border border-gray-200/10 rounded-xl shadow-lg dark:bg-gray-800/50 dark:border-gray-700/50 hover:bg-gray-800/70 transition-all duration-300 mb-3" data-request-id="${request.id}">
        <div class="flex items-center p-4 space-x-4">
            <div class="relative group shrink-0">
                <div class="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full opacity-0 group-hover:opacity-50 transition duration-500 blur"></div>
                <img class="relative w-16 h-16 rounded-full shadow-lg object-cover ring-2 ring-gray-700/50" 
                     src="http://localhost:8080/user${request.avatar}" 
                     alt="${request.username}'s avatar"/>
            </div>
            
            <div class="flex-1 min-w-0">
                <h5 class="text-lg font-medium text-white group-hover:text-purple-400 transition-colors truncate">
                    ${request.username}
                </h5>
                <p class="text-sm text-gray-400">Wants to be your friend</p>
            </div>

            <div class="flex items-center space-x-2">
                <div class="group/tooltip relative">
                    <button class="accept-button inline-flex items-center p-2 text-sm font-medium text-center text-white bg-gray-800/70 border border-gray-600/30 rounded-lg hover:bg-green-500/30 hover:border-green-500/50 focus:ring-2 focus:outline-none focus:ring-green-500/50 transition-all duration-200 backdrop-blur-sm group">
                        <svg class="w-5 h-5 group-hover:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </button>
                    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200">
                        Accept Request
                        <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                    </div>
                </div>

                <div class="group/tooltip relative">
                    <button class="reject-button inline-flex items-center p-2 text-sm font-medium text-center text-white bg-gray-800/70 border border-gray-600/30 rounded-lg hover:bg-red-500/30 hover:border-red-500/50 focus:ring-2 focus:outline-none focus:ring-red-500/50 transition-all duration-200 backdrop-blur-sm group">
                        <svg class="w-5 h-5 group-hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200">
                        Reject Request
                        <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;
}

export const requestComponent = (requests: FriendRequest[]) => {
    return `
    <div class="w-full space-y-3">
        ${requests.map(request => requestCard(request)).join('')}
    </div>
    `;
}