import { UserState } from './userState';
import { redirectTo } from './router';

export function showGameOverModal(gameResult: { winnerId: number, score1: number, score2: number }): void {
    const userId = UserState.getUser()?.id;
    const isWinner = userId === gameResult.winnerId;
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-[1000]';
    
    // Создаем фоновые частицы для анимации
    const particles = document.createElement('div');
    particles.className = 'absolute inset-0 overflow-hidden pointer-events-none';
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = `absolute w-2 h-2 bg-purple-500/30 rounded-full
            animate-[float_${3 + Math.random() * 2}s_ease-in-out_infinite]`;
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 2}s`;
        particles.appendChild(particle);
    }
    modal.appendChild(particles);

    const content = document.createElement('div');
    content.className = 'relative';
    content.innerHTML = `
        <div class="relative z-[1001]">
            <div class="absolute inset-0 bg-purple-500/20 blur-3xl rounded-3xl"></div>
            <div class="relative bg-gray-900/80 backdrop-blur-sm p-12 rounded-3xl shadow-2xl 
                        border border-purple-500/20 overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent"></div>
                
                <!-- Winner/Loser Icon with Glow -->
                <div class="relative mb-8">
                    <div class="absolute inset-0 ${isWinner ? 'bg-yellow-500' : 'bg-purple-500'} blur-2xl opacity-30 
                                animate-[pulse_2s_ease-in-out_infinite]"></div>
                    <div class="relative text-center">
                        <span class="text-8xl transform inline-block
                                   ${isWinner 
                                       ? 'animate-[bounce_1s_ease-in-out_infinite] rotate-12' 
                                       : 'animate-[spin_3s_linear_infinite] rotate-180'}">
                            ${isWinner ? '👑' : '💀'}
                        </span>
                    </div>
                </div>

                <!-- Title with Gradient -->
                <h2 class="text-5xl font-black mb-8 text-center tracking-wider
                          ${isWinner 
                              ? 'bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400' 
                              : 'bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400'}
                          bg-clip-text text-transparent
                          animate-[pulse_2s_ease-in-out_infinite]">
                    ${isWinner ? 'VICTORY!' : 'DEFEAT'}
                </h2>

                <!-- Score Display -->
                <div class="relative mb-8">
                    <div class="absolute inset-0 bg-purple-500/20 blur-xl rounded-2xl"></div>
                    <div class="relative bg-black/40 backdrop-blur-sm p-6 rounded-2xl border border-purple-500/20">
                        <div class="flex items-center justify-center gap-8">
                            <div class="text-7xl font-black ${isWinner ? 'text-green-400' : 'text-red-400'}
                                      animate-[pulse_2s_ease-in-out_infinite]">
                                ${gameResult.score1}
                            </div>
                            <div class="text-5xl font-bold text-gray-400">VS</div>
                            <div class="text-7xl font-black ${isWinner ? 'text-red-400' : 'text-green-400'}
                                      animate-[pulse_2s_ease-in-out_infinite]">
                                ${gameResult.score2}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Message -->
                <p class="text-2xl font-medium text-center
                         ${isWinner ? 'text-yellow-300' : 'text-purple-300'}
                         tracking-wide">
                    ${isWinner 
                        ? 'Absolutely Legendary! 🌟' 
                        : 'Better Luck Next Time! 🎮'}
                </p>
            </div>
        </div>
    `;

    // Add keyframes for float animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes float {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
        }
    `;
    document.head.appendChild(style);

    modal.appendChild(content);
    document.body.appendChild(modal);

    // Add fade-out animation before redirect
    setTimeout(() => {
        modal.classList.add('transition-opacity', 'duration-500', 'opacity-0');
        setTimeout(() => {
            modal.remove();
            style.remove();
            redirectTo('/profile');
        }, 500);
    }, 4500);
} 