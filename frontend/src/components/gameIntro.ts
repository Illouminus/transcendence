interface Player {
    id: number;
    username: string;
    avatar: string;
}

interface GameIntroProps {
    player1: Player;
    player2: Player;
    onReady: () => void;
}

export function createGameIntro({ player1, player2, onReady }: GameIntroProps): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50';

    const content = document.createElement('div');
    content.className = 'relative w-full max-w-6xl p-8 flex items-center justify-center gap-24';

    // Player 1 Card
    const player1Card = document.createElement('div');
    player1Card.className = 'transform -translate-x-full opacity-0 transition-all duration-1000 ease-out';
    player1Card.innerHTML = `
        <div class="bg-gray-900/80 backdrop-blur rounded-lg p-8 shadow-2xl shadow-purple-500/20 
                    border border-purple-500/20 w-[320px]
                    transform hover:scale-105 hover:-rotate-2 transition-all duration-300">
            <div class="flex flex-col items-center space-y-6">
                <div class="relative">
                    <div class="absolute inset-0 bg-purple-500 blur-xl opacity-20 animate-pulse"></div>
                    <img src="${player1.avatar}" alt="${player1.username}" 
                         class="relative w-32 h-32 rounded-2xl border-2 border-purple-500/50 object-cover shadow-lg"/>
                </div>
                <div class="space-y-2 text-center">
                    <h3 class="text-3xl font-bold text-white tracking-wider">${player1.username}</h3>
                    <div class="text-purple-400 text-lg font-medium tracking-widest uppercase">Player 1</div>
                </div>
            </div>
        </div>
    `;

    // VS Text with Lightning Effect
    const vsText = document.createElement('div');
    vsText.className = 'absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 scale-150';
    vsText.innerHTML = `
        <div class="relative">
            <div class="absolute inset-0 bg-purple-500 blur-2xl opacity-30 animate-pulse"></div>
            <div class="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-purple-400 to-purple-600
                        transform hover:scale-110 transition-all duration-300 cursor-default
                        relative z-10 animate-[pulse_2s_ease-in-out_infinite]">
                ⚡VS⚡
            </div>
            <div class="absolute inset-0 bg-purple-500/20 blur-3xl -z-10 animate-pulse"></div>
        </div>
    `;

    // Player 2 Card
    const player2Card = document.createElement('div');
    player2Card.className = 'transform translate-x-full opacity-0 transition-all duration-1000 ease-out';
    player2Card.innerHTML = `
        <div class="bg-gray-900/80 backdrop-blur rounded-lg p-8 shadow-2xl shadow-purple-500/20 
                    border border-purple-500/20 w-[320px]
                    transform hover:scale-105 hover:rotate-2 transition-all duration-300">
            <div class="flex flex-col items-center space-y-6">
                <div class="relative">
                    <div class="absolute inset-0 bg-purple-500 blur-xl opacity-20 animate-pulse"></div>
                    <img src="${player2.avatar}" alt="${player2.username}" 
                         class="relative w-32 h-32 rounded-2xl border-2 border-purple-500/50 object-cover shadow-lg"/>
                </div>
                <div class="space-y-2 text-center">
                    <h3 class="text-3xl font-bold text-white tracking-wider">${player2.username}</h3>
                    <div class="text-purple-400 text-lg font-medium tracking-widest uppercase">Player 2</div>
                </div>
            </div>
        </div>
    `;

    // Ready Button with Glow Effect
    const readyButton = document.createElement('button');
    readyButton.className = 'absolute left-1/2 bottom-12 transform -translate-x-1/2 translate-y-full opacity-0 transition-all duration-500 ease-out';
    readyButton.innerHTML = `
        <div class="relative group">
            <div class="absolute inset-0 bg-purple-600 rounded-full blur-xl opacity-75 group-hover:opacity-100 transition-opacity"></div>
            <div class="relative bg-gradient-to-br from-purple-500 to-purple-700 text-white font-bold py-4 px-12 rounded-full 
                        transform group-hover:scale-105 transition-all duration-300 shadow-lg
                        border border-purple-400/30
                        flex items-center space-x-3">
                <span class="text-2xl tracking-wider">READY</span>
                <svg class="w-8 h-8 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M14 5l7 7-7 7M5 5l7 7-7 7"/>
                </svg>
            </div>
        </div>
    `;
    readyButton.addEventListener('click', onReady);

    // Add elements to container
    content.appendChild(player1Card);
    content.appendChild(vsText);
    content.appendChild(player2Card);
    content.appendChild(readyButton);
    container.appendChild(content);

    // Trigger animations with slight delays
    setTimeout(() => {
        player1Card.classList.remove('-translate-x-full', 'opacity-0');
        player1Card.classList.add('translate-x-0', 'opacity-100');
    }, 300);

    setTimeout(() => {
        vsText.classList.remove('opacity-0');
        vsText.classList.add('opacity-100');
    }, 1000);

    setTimeout(() => {
        player2Card.classList.remove('translate-x-full', 'opacity-0');
        player2Card.classList.add('translate-x-0', 'opacity-100');
    }, 600);

    setTimeout(() => {
        readyButton.classList.remove('translate-y-full', 'opacity-0');
        readyButton.classList.add('translate-y-0', 'opacity-100');
    }, 1500);

    return container;
} 