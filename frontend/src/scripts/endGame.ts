import confetti from 'canvas-confetti';
import { UserState } from './userState';
import { redirectTo } from './router';

export function showGameOverModal(gameResult: { winnerId: number, score1: number, score2: number }): void {
    const userId = UserState.getUser()?.id;
    const isWinner = userId === gameResult.winnerId;
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-100';
    modal.innerHTML = `
        <div class="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-xl shadow-2xl transform scale-95 animate-bounce">
            <div class="text-center mb-6">
                ${isWinner 
                    ? '<span class="text-8xl animate-bounce">🏆</span>'
                    : '<span class="text-8xl animate-spin">🤡</span>'}
            </div>
            <h2 class="text-4xl font-bold mb-4 text-center ${isWinner ? 'text-yellow-400' : 'text-white'} animate-pulse">
                ${isWinner ? 'ABSOLUTE CHAMPION!' : 'LOL... NOOB!'}
            </h2>
            <div class="bg-black bg-opacity-30 p-4 rounded-lg mb-6">
                <div class="text-7xl font-bold text-center ${isWinner ? 'text-green-400' : 'text-red-400'} animate-pulse">
                    ${gameResult.score1} : ${gameResult.score2}
                </div>
            </div>
            <p class="text-gray-300 text-xl text-center italic">
                ${isWinner 
                    ? 'You\'re breathtaking! 🌟' 
                    : 'Did you even try? 😂'}
            </p>
        </div>
    `;

    document.body.appendChild(modal);

    if (isWinner) {
        // Победный салют
        const duration = 4000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        function randomInRange(min: number, max: number) {
            return Math.random() * (max - min) + min;
        }

        const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            
            // Конфетти с разных сторон
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            });
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            });
            
            // Добавим золотые конфетти в центре
            confetti({
                ...defaults,
                particleCount: particleCount * 0.5,
                origin: { x: 0.5, y: 0.5 },
                colors: ['#FFD700', '#FFA500', '#FF8C00'],
                gravity: 0.8,
                scalar: 2
            });
        }, 250);
    } else {
        // Для проигравшего - падающие вниз эмодзи клоунов
        const emojis = ['🤡', '😭', '💩', '🎪'];
        const container = document.createElement('div');
        container.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1000;';
        document.body.appendChild(container);

        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const emoji = document.createElement('div');
                emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                emoji.style.cssText = `
                    position: absolute;
                    left: ${Math.random() * 100}%;
                    top: -50px;
                    font-size: 30px;
                    animation: fall 3s linear;
                `;
                container.appendChild(emoji);

                setTimeout(() => emoji.remove(), 3000);
            }, i * 200);
        }

        // Добавляем стили анимации
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fall {
                to {
                    transform: translateY(100vh) rotate(360deg);
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Автоматический редирект через 5 секунд
    setTimeout(() => {
        modal.remove();
        redirectTo('/profile');
    }, 5000);
} 