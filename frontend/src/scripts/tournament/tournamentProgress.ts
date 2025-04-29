import { UserState } from '../userState';
import { TournamentState, TournamentPlayer, MatchPair, DisplayPlayer } from '../types/tournament.types';
import { mapTournamentMatchToDisplay } from '../outils/showGameIntroWithPlayer';

export function showTournamentProgress(): HTMLDivElement {
    const tournamentState = UserState.getTournamentState();
    if (!tournamentState || !tournamentState.matches?.semifinals) {
        throw new Error("Tournament state or matches are not available");
    }

    const phase = tournamentState.phase;
    const semifinals: MatchPair[] = tournamentState.matches.semifinals.map(mapTournamentMatchToDisplay);
    const finalMatch = tournamentState.matches.final ? mapTournamentMatchToDisplay(tournamentState.matches.final) : null;

    // Определяем проигравших в полуфиналах
    let losers: DisplayPlayer[] = [];
    if (phase === 'final' && tournamentState.matches.final) {
        for (const match of semifinals) {
            if (match.winner !== match.player1.id) losers.push(match.player1);
            else losers.push(match.player2);
        }
    }

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/90 backdrop-blur-lg flex items-center justify-center z-[1000] opacity-100 scale-100 transition-all duration-500';

    const content = document.createElement('div');
    content.className = 'relative w-full max-w-5xl p-8 flex flex-col items-center';

    const particles = createParticles();
    modal.appendChild(particles);

    const style = createAnimationsStyle();
    document.head.appendChild(style);

    if (phase === 'final' && finalMatch) {
        // UI для финала: финалисты в центре, проигравшие по бокам
        content.innerHTML = `
            <div class="relative z-[1001] w-full">
                <div class="text-center mb-12">
                    <h2 class="text-5xl font-extrabold tracking-wider text-transparent bg-clip-text
                              bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-400 drop-shadow-neon animate-[pulse_2s_ease-in-out_infinite]">
                        FINAL
                    </h2>
                    <div class="mt-2 text-lg text-yellow-200/80 font-medium tracking-wide animate-fadeIn">Who will be the champion?</div>
                </div>
                <div class="relative flex flex-row items-center justify-center gap-32 w-full animate-fadeInUp">
                    <!-- Loser 1 -->
                    <div class="flex flex-col items-center gap-8 relative group">
                        ${createPlayerCardModern(losers[0], 'left', true, true)}
                        <div class="loser-label animate-fadeIn">Loser</div>
                    </div>
                    <!-- Center Finalists and VS -->
                    <div class="flex flex-col items-center gap-8 relative">
                        ${createPlayerCardModern(finalMatch.player1, 'center', true, false)}
                        <div class="vs-badge animate-vsPop">VS</div>
                        ${createPlayerCardModern(finalMatch.player2, 'center', false, false)}
                    </div>
                    <!-- Loser 2 -->
                    <div class="flex flex-col items-center gap-8 relative group">
                        ${createPlayerCardModern(losers[1], 'right', false, true)}
                        <div class="loser-label animate-fadeIn">Loser</div>
                    </div>
                </div>
            </div>
        `;
    } else {
        // UI для полуфиналов (как раньше)
        content.innerHTML = `
            <div class="relative z-[1001] w-full">
                <div class="text-center mb-12">
                    <h2 class="text-5xl font-extrabold tracking-wider text-transparent bg-clip-text
                              bg-gradient-to-r from-purple-400 via-pink-500 to-yellow-400 drop-shadow-neon animate-[pulse_2s_ease-in-out_infinite]">
                        SEMIFINALS
                    </h2>
                    <div class="mt-2 text-lg text-purple-200/80 font-medium tracking-wide animate-fadeIn">Who will reach the final?</div>
                </div>
                <div class="relative flex flex-row items-center justify-center gap-32 w-full animate-fadeInUp">
                    <!-- Match 1 -->
                    <div class="flex flex-col items-center gap-8 relative group">
                        ${createPlayerCardModern(semifinals[0].player1, 'left', true, false)}
                        <div class="arrow-connector left-arrow animate-arrowIn"></div>
                        ${createPlayerCardModern(semifinals[0].player2, 'left', false, false)}
                    </div>
                    <!-- Center VS and lines -->
                    <div class="flex flex-col items-center gap-8 relative">
                        <div class="h-32 w-1 bg-gradient-to-b from-purple-500/80 to-yellow-400/40 rounded-full shadow-neon animate-glowLine"></div>
                        <div class="vs-badge animate-vsPop">VS</div>
                        <div class="h-32 w-1 bg-gradient-to-t from-purple-500/80 to-yellow-400/40 rounded-full shadow-neon animate-glowLine"></div>
                    </div>
                    <!-- Match 2 -->
                    <div class="flex flex-col items-center gap-8 relative group">
                        ${createPlayerCardModern(semifinals[1].player1, 'right', true, false)}
                        <div class="arrow-connector right-arrow animate-arrowIn"></div>
                        ${createPlayerCardModern(semifinals[1].player2, 'right', false, false)}
                    </div>
                </div>
                <div class="absolute left-1/2 -translate-x-1/2 bottom-0 mt-12 flex flex-col items-center">
                    <div class="final-arrow animate-finalArrow"></div>
                    <div class="final-label animate-fadeInUp">Final</div>
                </div>
            </div>
        `;
    }

    modal.appendChild(content);
    document.body.appendChild(modal);

    setTimeout(() => {
        modal.classList.add('opacity-0', 'scale-90');
        setTimeout(() => {
            modal.remove();
        }, 2000);
    }, 3500);

    return modal;
}

// Новый современный карточный UI игрока
function createPlayerCardModern(player: DisplayPlayer, side: 'left' | 'right' | 'center', isTop: boolean, isLoser: boolean): string {
    return `
        <div class="relative flex flex-col items-center animate-slideIn${side === 'left' ? 'Left' : side === 'right' ? 'Right' : ''}">
            <div class="player-card-neon ${isTop ? 'from-pink-500/60 to-purple-500/40' : 'from-yellow-400/60 to-pink-400/40'} ${isLoser ? 'opacity-40 grayscale' : ''}">
                <div class="relative">
                    <img src="${player.avatar}" alt="${player.username}"
                        class="w-24 h-24 rounded-full border-4 border-purple-400/60 shadow-neon object-cover relative z-10 animate-avatarPop"/>
                    <div class="absolute -inset-2 rounded-full bg-gradient-to-br from-purple-500/30 to-yellow-400/10 blur-lg z-0"></div>
                </div>
                <div class="mt-4 text-center">
                    <h3 class="text-2xl font-bold text-white drop-shadow-neon">${player.username}</h3>
                    <div class="text-sm font-semibold uppercase tracking-wider text-purple-200/80 mt-1 animate-fadeIn">${isLoser ? 'Loser' : player.status}</div>
                </div>
            </div>
        </div>
    `;
}

// Анимированные стрелки между игроками и финалом
// (CSS ниже)

// Частицы
function createParticles(): HTMLDivElement {
    const particles = document.createElement('div');
    particles.className = 'absolute inset-0 overflow-hidden pointer-events-none';
    for (let i = 0; i < 40; i++) {
        const particle = document.createElement('div');
        particle.className = `absolute w-1.5 h-1.5 bg-pink-400/30 rounded-full animate-[float_${3 + Math.random() * 2}s_ease-in-out_infinite]`;
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 2}s`;
        particles.appendChild(particle);
    }
    return particles;
}

// Стили анимаций и неоновых элементов
function createAnimationsStyle(): HTMLStyleElement {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes float {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes slideInLeft {
            from { transform: translateX(-80px) scale(0.9); opacity: 0; }
            to { transform: translateX(0) scale(1); opacity: 1; }
        }
        @keyframes slideInRight {
            from { transform: translateX(80px) scale(0.9); opacity: 0; }
            to { transform: translateX(0) scale(1); opacity: 1; }
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(40px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes vsPop {
            0% { transform: scale(0.7); opacity: 0; }
            60% { transform: scale(1.2); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
        }
        @keyframes avatarPop {
            0% { transform: scale(0.7); opacity: 0; }
            80% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
        }
        @keyframes arrowIn {
            from { opacity: 0; transform: scaleY(0.5) translateY(-20px); }
            to { opacity: 1; transform: scaleY(1) translateY(0); }
        }
        @keyframes glowLine {
            0% { box-shadow: 0 0 0 0 #f472b6; }
            100% { box-shadow: 0 0 24px 8px #f472b6; }
        }
        @keyframes finalArrow {
            0% { opacity: 0; transform: translateY(30px) scaleY(0.7); }
            80% { opacity: 1; transform: translateY(-10px) scaleY(1.1); }
            100% { opacity: 1; transform: translateY(0) scaleY(1); }
        }
        .player-card-neon {
            background: linear-gradient(135deg, var(--tw-gradient-stops));
            border-radius: 1.5rem;
            padding: 2rem 2.5rem;
            box-shadow: 0 0 32px 0 #a21caf33, 0 2px 16px 0 #f472b633;
            border: 2px solid #a21caf44;
            position: relative;
            z-index: 1;
            min-width: 220px;
            transition: box-shadow 0.3s, transform 0.3s;
        }
        .player-card-neon:hover {
            box-shadow: 0 0 48px 8px #f472b6cc, 0 2px 24px 0 #a21caf99;
            transform: scale(1.04);
        }
        .drop-shadow-neon {
            text-shadow: 0 0 8px #f472b6, 0 0 16px #a21caf;
        }
        .shadow-neon {
            box-shadow: 0 0 16px 2px #f472b6, 0 0 32px 4px #a21caf44;
        }
        .vs-badge {
            background: linear-gradient(90deg, #f472b6 0%, #a21caf 100%);
            color: #fff;
            font-size: 2.5rem;
            font-weight: 900;
            border-radius: 9999px;
            padding: 0.5rem 2.5rem;
            box-shadow: 0 0 24px 4px #f472b6cc;
            letter-spacing: 0.2em;
            margin: 0.5rem 0;
            animation: vsPop 0.7s cubic-bezier(.7,-0.2,.7,1.5) 0.5s both;
        }
        .arrow-connector {
            width: 32px;
            height: 32px;
            position: relative;
            margin: 0.5rem 0;
        }
        .left-arrow::before, .right-arrow::before {
            content: '';
            position: absolute;
            left: 50%;
            top: 0;
            width: 4px;
            height: 48px;
            background: linear-gradient(180deg, #a21caf 0%, #f472b6 100%);
            border-radius: 2px;
            box-shadow: 0 0 12px 2px #f472b6cc;
            transform: translateX(-50%);
            animation: arrowIn 0.7s cubic-bezier(.7,-0.2,.7,1.5) both;
        }
        .left-arrow::after, .right-arrow::after {
            content: '';
            position: absolute;
            left: 50%;
            top: 48px;
            border: solid transparent;
            border-width: 8px 8px 0 8px;
            border-top-color: #f472b6;
            transform: translateX(-50%);
            filter: drop-shadow(0 0 8px #f472b6cc);
        }
        .final-arrow {
            width: 8px;
            height: 64px;
            margin: 0 auto;
            background: linear-gradient(180deg, #f472b6 0%, #fde68a 100%);
            border-radius: 4px;
            box-shadow: 0 0 16px 2px #f472b6cc;
            position: relative;
            animation: finalArrow 1s cubic-bezier(.7,-0.2,.7,1.5) 1.2s both;
        }
        .final-arrow::after {
            content: '';
            position: absolute;
            left: 50%;
            bottom: -16px;
            border: solid transparent;
            border-width: 16px 12px 0 12px;
            border-top-color: #fde68a;
            transform: translateX(-50%);
            filter: drop-shadow(0 0 8px #fde68a);
        }
        .final-label {
            color: #fde68a;
            font-size: 1.5rem;
            font-weight: 700;
            letter-spacing: 0.15em;
            margin-top: 0.5rem;
            text-shadow: 0 0 8px #fde68a, 0 0 16px #f472b6;
            animation: fadeInUp 0.7s cubic-bezier(.7,-0.2,.7,1.5) 1.5s both;
        }
        .animate-slideInLeft { animation: slideInLeft 0.7s cubic-bezier(.7,-0.2,.7,1.5) both; }
        .animate-slideInRight { animation: slideInRight 0.7s cubic-bezier(.7,-0.2,.7,1.5) both; }
        .animate-fadeIn { animation: fadeIn 1s ease 0.2s both; }
        .animate-fadeInUp { animation: fadeInUp 1s cubic-bezier(.7,-0.2,.7,1.5) 0.3s both; }
        .animate-vsPop { animation: vsPop 0.7s cubic-bezier(.7,-0.2,.7,1.5) 0.5s both; }
        .animate-avatarPop { animation: avatarPop 0.7s cubic-bezier(.7,-0.2,.7,1.5) 0.2s both; }
        .animate-arrowIn { animation: arrowIn 0.7s cubic-bezier(.7,-0.2,.7,1.5) 0.3s both; }
        .animate-glowLine { animation: glowLine 1.2s cubic-bezier(.7,-0.2,.7,1.5) 0.7s both; }
        .animate-finalArrow { animation: finalArrow 1s cubic-bezier(.7,-0.2,.7,1.5) 1.2s both; }
    `;
    return style;
}