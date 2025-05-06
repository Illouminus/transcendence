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



    console.log("Phase", phase);
    console.log("Semifinals", semifinals);
    console.log("Final Match", finalMatch);

    let losers: DisplayPlayer[] = [];
    if (phase === 'final' && tournamentState.matches.final) {
        for (const match of semifinals) {
            if (match.winner !== match.player1.id) losers.push(match.player1);
            else losers.push(match.player2);
        }
    }

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-[1000] transition-all duration-300';

    const content = document.createElement('div');
    content.className = 'relative w-full max-w-4xl p-6 flex flex-col items-center';

    if (phase === 'final' && finalMatch) {
        content.innerHTML = `
            <div class="relative z-[1001] w-full">
                <div class="text-center mb-8">
                    <h2 class="text-4xl font-bold text-white mb-2">FINAL</h2>
                    <div class="text-gray-400">The ultimate battle</div>
                </div>
                <div class="flex flex-row items-center justify-center gap-16">
                    <!-- Eliminated Players -->
                    <div class="flex flex-col items-center gap-6">
                        <div class="text-sm text-gray-500 mb-2">Eliminated</div>
                        ${createPlayerCard(losers[0], true)}
                        ${createPlayerCard(losers[1], true)}
                    </div>
                    <!-- Finalists -->
                    <div class="flex flex-col items-center gap-6">
                        <div class="text-sm text-purple-400 mb-2">Finalists</div>
                        ${createPlayerCard(finalMatch.player1, false)}
                        <div class="text-2xl font-bold text-white bg-purple-600/20 px-6 py-2 rounded-full">VS</div>
                        ${createPlayerCard(finalMatch.player2, false)}
                    </div>
                </div>
            </div>
        `;
    } else {
        content.innerHTML = `
            <div class="relative z-[1001] w-full">
                <div class="text-center mb-8">
                    <h2 class="text-4xl font-bold text-white mb-2">SEMIFINALS</h2>
                    <div class="text-gray-400">Choose your champions</div>
                </div>
                <div class="flex flex-row items-center justify-center gap-16">
                    <!-- Match 1 -->
                    <div class="flex flex-col items-center gap-4">
                        <div class="text-sm text-purple-400 mb-2">Match 1</div>
                        ${createPlayerCard(semifinals[0].player1, false)}
                        <div class="h-8 w-0.5 bg-purple-500/30"></div>
                        ${createPlayerCard(semifinals[0].player2, false)}
                    </div>
                    <div class="flex flex-col items-center gap-4">
                        <div class="h-16 w-0.5 bg-purple-500/30"></div>
                        <div class="text-2xl font-bold text-white bg-purple-600/20 px-6 py-2 rounded-full">VS</div>
                        <div class="h-16 w-0.5 bg-purple-500/30"></div>
                    </div>
                    <!-- Match 2 -->
                    <div class="flex flex-col items-center gap-4">
                        <div class="text-sm text-purple-400 mb-2">Match 2</div>
                        ${createPlayerCard(semifinals[1].player1, false)}
                        <div class="h-8 w-0.5 bg-purple-500/30"></div>
                        ${createPlayerCard(semifinals[1].player2, false)}
                    </div>
                </div>
                <div class="absolute left-1/2 -translate-x-1/2 bottom-0 mt-8 flex flex-col items-center">
                    <div class="h-12 w-0.5 bg-purple-500/30"></div>
                    <div class="text-lg font-semibold text-purple-400 mt-2">Final</div>
                </div>
            </div>
        `;
    }

    modal.appendChild(content);
    document.body.appendChild(modal);

    setTimeout(() => {
        modal.classList.add('opacity-0');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }, 3000);

    return modal;
}

function createPlayerCard(player: DisplayPlayer, isLoser: boolean): string {
    return `
        <div class="flex flex-col items-center">
            <div class="relative group ${isLoser ? 'opacity-40 grayscale' : ''}">
                <div class="relative">
                    <img src="${player.avatar}" alt="${player.username}"
                        class="w-24 h-24 object-cover border-2 ${isLoser ? 'border-gray-600' : 'border-purple-500/30'}"/>
                </div>
                <div class="mt-2 text-center">
                    <h3 class="text-lg font-semibold ${isLoser ? 'text-gray-500' : 'text-white'}">${player.username}</h3>
                    <div class="text-sm ${isLoser ? 'text-gray-600' : 'text-purple-300/80'}">${isLoser ? 'Eliminated' : player.status}</div>
                </div>
            </div>
        </div>
    `;
}