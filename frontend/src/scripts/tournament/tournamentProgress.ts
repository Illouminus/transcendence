import { UserState } from '../userState';

interface TournamentPlayer {
    id: number;
    username: string;
    avatar: string;
    status: 'playing' | 'winner' | 'loser' | 'waiting';
}

interface MatchPair {
    player1: TournamentPlayer;
    player2: TournamentPlayer;
    score1?: number;
    score2?: number;
    winner?: number;
}

interface TournamentState {
    phase: 'semifinals' | 'finals' | 'completed';
    matches: MatchPair[];
}

export function showTournamentProgress(gameResult: any): HTMLDivElement {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-[1000] opacity-100 scale-100 transition-all duration-500';

    const content = document.createElement('div');
    content.className = 'relative w-full max-w-7xl p-8';
    
    // Создаем фоновые частицы
    const particles = document.createElement('div');
    particles.className = 'absolute inset-0 overflow-hidden pointer-events-none';
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = `absolute w-1 h-1 bg-purple-500/30 rounded-full
            animate-[float_${3 + Math.random() * 2}s_ease-in-out_infinite]`;
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 2}s`;
        particles.appendChild(particle);
    }
    modal.appendChild(particles);

    // Добавляем стили для анимаций
    const style = document.createElement('style');
    style.textContent = `
        @keyframes float {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes slideIn {
            from { transform: translateY(100px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        @keyframes connectLine {
            from { height: 0; opacity: 0; }
            to { height: 100%; opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    function createPlayerCard(player: TournamentPlayer, delay: number): string {
        const statusColors = {
            playing: 'text-blue-400',
            winner: 'text-green-400',
            loser: 'text-red-400',
            waiting: 'text-gray-400'
        };

        return `
            <div class="relative bg-gray-900/80 backdrop-blur-sm p-6 rounded-2xl border border-purple-500/20
                        transform transition-all duration-500 hover:scale-105
                        animate-[slideIn_0.5s_ease-out_forwards]"
                 style="opacity: 0; animation-delay: ${delay}ms">
                <div class="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent rounded-2xl"></div>
                <div class="relative flex items-center gap-4">
                    <div class="relative">
                        <div class="absolute inset-0 bg-purple-500/20 rounded-full blur-md"></div>
                        <img src="${player.avatar}" alt="${player.username}"
                             class="w-16 h-16 rounded-full border-2 border-purple-500/50 object-cover relative"/>
                    </div>
                    <div>
                        <h3 class="text-xl font-bold text-white">${player.username}</h3>
                        <div class="${statusColors[player.status]} text-sm font-medium uppercase tracking-wider">
                            ${player.status}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function createMatchPairDisplay(match: MatchPair, index: number): string {
        return `
            <div class="relative flex flex-col items-center gap-8 animate-[pulse_2s_ease-in-out_infinite]">
                ${createPlayerCard(match.player1, 300 + index * 200)}
                <div class="w-1 bg-purple-500/30 animate-[connectLine_1s_ease-out_forwards]" 
                     style="height: 60px; opacity: 0; animation-delay: ${600 + index * 200}ms"></div>
                ${createPlayerCard(match.player2, 400 + index * 200)}
                ${match.score1 !== undefined ? `
                    <div class="absolute left-full ml-4 top-1/2 -translate-y-1/2
                               text-3xl font-bold text-white/80">
                        ${match.score1} - ${match.score2}
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Временно захардкодим данные для демонстрации
    const state: TournamentState = {
        phase: 'semifinals',
        matches: [
            {
                player1: { id: 1, username: "Player 1", avatar: "/images/default_avatar.png", status: "playing" },
                player2: { id: 2, username: "Player 2", avatar: "/images/default_avatar.png", status: "playing" }
            },
            {
                player1: { id: 3, username: "Player 3", avatar: "/images/default_avatar.png", status: "winner" },
                player2: { id: 4, username: "Player 4", avatar: "/images/default_avatar.png", status: "loser" },
                score1: 5,
                score2: 3
            }
        ]
    };

    content.innerHTML = `
        <div class="relative z-[1001]">
            <!-- Tournament Phase Title -->
            <div class="text-center mb-12">
                <h2 class="text-4xl font-black tracking-wider text-transparent bg-clip-text
                          bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400
                          animate-[pulse_2s_ease-in-out_infinite]">
                    ${state.phase.toUpperCase()}
                </h2>
            </div>

            <!-- Matches Display -->
            <div class="flex justify-around items-center gap-24">
                ${state.matches.map((match, index) => createMatchPairDisplay(match, index)).join('')}
            </div>
        </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    return modal;
} 