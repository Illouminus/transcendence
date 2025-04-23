import { UserState } from './userState';
import { showAlert } from './services/alert.service';
import { redirectTo } from './router';

// Tournament state interface
interface TournamentState {
    tournamentId: number | null;
    phase: 'waiting' | 'semifinals' | 'third_place' | 'final' | 'completed';
    players: Player[];
    matches?: {
        semifinals?: Array<{
            player1Id: number;
            player2Id: number;
            gameId?: string;
            winner?: number;
        }>;
        thirdPlace?: {
            player1Id: number;
            player2Id: number;
            gameId?: string;
            winner?: number;
        };
        final?: {
            player1Id: number;
            player2Id: number;
            gameId?: string;
            winner?: number;
        };
    };
}

// Player interface
interface Player {
    id: number;
    username: string;
    avatar: string;
    ready: boolean;
    isHost?: boolean;
}

// Global state
let tournamentState: TournamentState = {
    tournamentId: null,
    phase: 'waiting',
    players: []
};

let currentPlayer: Player | null = null;
let gameSocket: WebSocket | null = null;

// Update current player UI
function updateCurrentPlayer(): void {
    const user = UserState.getUser();
    if (!user) return;

    currentPlayer = currentPlayer || {
        id: user.id,
        username: user.username,
        avatar: user.avatar || '/images/default_avatar.png',
        ready: false,
        isHost: tournamentState.players.length === 0
    };

    console.log('Updating current player UI:', currentPlayer);

    const avatarElement = document.getElementById('current-player-avatar') as HTMLImageElement;
    const nameElement = document.getElementById('current-player-name');
    const readyElement = document.getElementById('current-player-ready');
    const statusElement = document.getElementById('current-player-status');
    const readyBtn = document.getElementById('ready-btn') as HTMLButtonElement;
    const leaveBtn = document.getElementById('leave-btn') as HTMLButtonElement;

    if (avatarElement) {
        avatarElement.src = "http://localhost:8080/user" + currentPlayer.avatar;
        avatarElement.alt = `${currentPlayer.username}'s avatar`;
    }

    if (nameElement) {
        nameElement.textContent = currentPlayer.username;
    }

    // Base button styles for both buttons
    const baseButtonStyle = 'px-4 py-2 rounded-md bg-opacity-50 border border-gray-600 transition-all duration-200';
    
    // Ready button styles
    if (readyBtn) {
        readyBtn.textContent = currentPlayer.ready ? 'Ready ✓' : 'Ready';
        readyBtn.className = `${baseButtonStyle} ${
            currentPlayer.ready 
                ? 'bg-green-500 text-green-100 cursor-not-allowed'
                : 'bg-gray-700 text-gray-100 hover:bg-gray-600'
        }`;
        readyBtn.disabled = currentPlayer.ready;
    }

    // Leave button styles
    if (leaveBtn) {
        leaveBtn.className = `${baseButtonStyle} bg-red-900 text-red-100 hover:bg-red-800`;
    }

    if (readyElement) {
        readyElement.textContent = currentPlayer.ready ? 'Ready' : 'Not Ready';
        readyElement.className = currentPlayer.ready 
            ? 'px-3 py-1 rounded-full text-sm font-medium bg-green-500 bg-opacity-50 text-green-100'
            : 'px-3 py-1 rounded-full text-sm font-medium bg-gray-500 bg-opacity-50 text-gray-100';
    }

    if (statusElement) {
        statusElement.className = `absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-gray-800 ${
            currentPlayer.ready ? 'bg-green-500' : 'bg-gray-500'
        }`;
    }
}

// Update tournament state and trigger UI refresh
function updateTournamentState(newState: Partial<TournamentState>): void {
    // Ensure players have avatar field if provided
    if (newState.players) {
        newState.players = newState.players.map(player => ({
            ...player,
            avatar: player.avatar || '/images/default_avatar.png'
        }));
    }
    
    tournamentState = { ...tournamentState, ...newState };
    updateUI();
    
}

// Update all UI components
function updateUI(): void {
    updatePlayersList();
    updatePlayersCount();
    updateTournamentStatus();
    updateMatchesDisplay();
}

// Update players list in UI
function updatePlayersList(): void {
    const playersList = document.getElementById('players-list');
    const template = document.getElementById('player-card-template') as HTMLTemplateElement;
    
    if (!playersList || !template) return;

    playersList.innerHTML = '';
    
    tournamentState.players.forEach(player => {
        const card = template.content.cloneNode(true) as DocumentFragment;
        const playerCard = card.querySelector('.player-card');
        
        if (playerCard) {
            const img = playerCard.querySelector('img');
            const name = playerCard.querySelector('h3');
            const status = playerCard.querySelector('.player-status');
            const statusIndicator = playerCard.querySelector('.status-indicator');
            
            if (img) {
                img.src = player.avatar || '/images/default_avatar.png';
                img.alt = `${player.username}'s avatar`;
            }
            
            if (name) {
                name.textContent = player.username;
            }
            
            if (status) {
                status.textContent = player.ready ? 'Ready' : 'Not Ready';
            }

            if (statusIndicator) {
                statusIndicator.classList.add(player.ready ? 'bg-green-500' : 'bg-yellow-500');
            }
            
            playersList.appendChild(card);
        }
    });
}

// Update players count display
function updatePlayersCount(): void {
    const countElement = document.getElementById('players-count');
    if (countElement) {
        const totalPlayers = tournamentState.players.length + (currentPlayer ? 1 : 0);
        countElement.textContent = `${totalPlayers}/4`;
    }
}

// Update tournament status display
function updateTournamentStatus(): void {
    const statusElement = document.getElementById('tournament-status');
    if (!statusElement) return;

    let status = '';
    let type: 'yellow' | 'green' | 'red' = 'yellow';

    switch (tournamentState.phase) {
        case 'waiting':
            const totalPlayers = tournamentState.players.length + (currentPlayer ? 1 : 0);
            const allReady = currentPlayer?.ready && tournamentState.players.every(p => p.ready);
            
            if (totalPlayers < 4) {
                status = `Waiting for players (${totalPlayers}/4)`;
                type = 'yellow';
            } else if (!allReady) {
                status = 'Waiting for all players to be ready';
                type = 'yellow';
            } else {
                status = 'All players ready!';
                type = 'green';
            }
            break;
        case 'semifinals':
            status = 'Semifinals in progress';
            type = 'green';
            break;
        case 'third_place':
            status = 'Third place match';
            type = 'green';
            break;
        case 'final':
            status = 'Final match';
            type = 'green';
            break;
        case 'completed':
            status = 'Tournament completed';
            type = 'green';
            break;
    }

    statusElement.textContent = status;
    statusElement.className = `text-lg text-${type}-500`;
}

// Update tournament bracket display
function updateMatchesDisplay(): void {
    // TODO: Implement tournament bracket visualization
    // Show current matches, results, and progression
}

// User actions
function leaveTournament(): void {
    if (gameSocket && tournamentState.tournamentId) {
        gameSocket.send(JSON.stringify({
            type: 'leave_tournament',
            payload: { tournamentId: tournamentState.tournamentId }
        }));
    }
    redirectTo('/');
}

function toggleReady(): void {
    if (!currentPlayer || !gameSocket || !tournamentState.tournamentId) {
        console.log('Toggle ready failed:', { currentPlayer, gameSocket: !!gameSocket, tournamentId: tournamentState.tournamentId });
        return;
    }

    const newReadyState = !currentPlayer.ready;
    console.log('Sending toggle ready:', newReadyState);
    
    gameSocket.send(JSON.stringify({
        type: 'toggle_ready',
        payload: { 
            tournamentId: tournamentState.tournamentId,
            ready: newReadyState
        }
    }));

    // Immediately update UI to give feedback
    currentPlayer.ready = newReadyState;
    updateCurrentPlayer();
    updateTournamentStatus();
}

// Main initialization function
export function initializeChampionship(): void {
    gameSocket = UserState.getGameSocket();
    if (!gameSocket) {
        showAlert('Game socket not available', 'danger');
        return;
    }

    console.log('Initializing championship...');

    // Check if we already have a tournamentId in UserState

    console.log('USER STATE GAME MODE :', UserState.getGameMode());

    const existingTournamentId = UserState.getGameMode()?.tournamentId;
    console.log('Existing tournament ID:', existingTournamentId);

    if(!existingTournamentId) {
        gameSocket.send(JSON.stringify({
            type: 'create_tournament',
            payload: {}
        }));
    }
    else {
        gameSocket.send(JSON.stringify({
            type: 'join_tournament',
            payload: existingTournamentId ? { tournamentId: existingTournamentId } : {}
        }));
    }
    
    // Initialize current player
    updateCurrentPlayer();

    // Setup button event handlers
    const leaveBtn = document.getElementById('leave-btn') as HTMLButtonElement;
    const readyBtn = document.getElementById('ready-btn') as HTMLButtonElement;
    
    if (leaveBtn) {
        leaveBtn.addEventListener('click', leaveTournament);
    }
    
    if (readyBtn) {
        readyBtn.addEventListener('click', () => {
            console.log('Ready button clicked');
            toggleReady();
        });
    }

    // Subscribe to tournament events through UserState
    UserState.onGameEvent((event) => {
        let isFriend: boolean = false;
        
        switch (event.type) {
            case 'tournament_created':
                if (event.tournamentId) {
                    console.log('Tournament created:', event.tournamentId);
                    updateTournamentState({ tournamentId: event.tournamentId });
                }
                break;
            case 'new_tournament_created':
                console.log('New tournament created GAME EVENT :', event.tournamentId);
                if (event.tournamentId) {
                    console.log('New tournament created:', event.tournamentId);
                    updateTournamentState({ tournamentId: event.tournamentId });
                }
                break;
            case 'tournament_state_update':
                if (event.tournamentState) {
                        const players = event.tournamentState.players.map(p => {
                        const friend = UserState.getUser()?.friends.find(friend => friend.friend_id === p.id);
                        if (!friend) 
                            return; 
                        isFriend = true;
                        return {
                            id: p.id,
                            username: friend ? friend.friend_username : 'Unknown',
                            avatar: friend ? 'http://localhost:8080/user' + friend.friend_avatar : 'http:://localhost::8080/user/images/default_avatar.png',
                            ready: p.ready
                        };
                    }).filter((player): player is Player => player !== undefined);
                    
                    if(!isFriend) return;

                    updateTournamentState({
                        phase: event.tournamentState.phase,
                        players,
                        tournamentId: event.tournamentState.tournamentId,
                        matches: event.tournamentState.matches
                    });
                }
                break;
            case 'tournament_match_start':
                if (event.tournamentMatch) {
                    console.log('Tournament match started:', event.tournamentMatch);
                    
                    // Redirect to game
                    redirectTo('/pong');
                }
                break;
            case 'tournament_completed':
                if (event.tournamentResult) {
                    showAlert(`Tournament completed! Your place: ${event.tournamentResult.place}`);
                    // Show results modal
                }
                break;
        }
    });

    // Initialize initial state
    updateUI();
}

