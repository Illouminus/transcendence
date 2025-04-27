import { GameEvent, UserState } from './userState';
import { showAlert } from './services/alert.service';
import { redirectTo } from './router';
import { TournamentState, Player } from './types/tournament.types';
import { trackedAddEventListener } from './outils/eventManager';

export let championshipGameEventHandler: ((event: GameEvent) => void) | null = null;
let messageListener: ((event: MessageEvent) => void) | null = null;
let gameSocket: WebSocket | null = null;
let currentPlayer: Player | null = null;

// Инициализация начального состояния
UserState.setTournamentState({
    tournamentId: null,
    phase: 'waiting',
    players: [],
});

function getTournamentState(): TournamentState {
    const state = UserState.getTournamentState();
    if (!state) throw new Error('Tournament state not initialized');
    return state;
}

function updateTournamentState(newState: Partial<TournamentState>): void {
    const currentState = getTournamentState();
    UserState.setTournamentState({
        ...currentState,
        ...newState,
        players: newState.players ?? currentState.players,
    });
    updateUI();
}

function updateCurrentPlayer(): void {
    const user = UserState.getUser();
    if (!user) return;

    currentPlayer = {
        id: user.id,
        username: user.username,
        avatar: user.avatar || '/images/default_avatar.png',
        ready: false,
        isHost: false,
    };

    const avatar = document.getElementById('current-player-avatar') as HTMLImageElement;
    const name = document.getElementById('current-player-name');
    const ready = document.getElementById('current-player-ready');
    const status = document.getElementById('current-player-status');

    if (avatar) avatar.src = "http://localhost:8080/user" + currentPlayer.avatar;
    if (name) name.textContent = currentPlayer.username;
    if (ready) ready.textContent = 'Not Ready';
    if (status) status.className = `absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-gray-800 bg-yellow-500`;
}

function updatePlayersList(): void {
    const playersList = document.getElementById('players-list');
    const template = document.getElementById('player-card-template') as HTMLTemplateElement;
    if (!playersList || !template) return;

    playersList.innerHTML = '';
    const players = getTournamentState().players;
    for (const player of players) {
        const card = template.content.cloneNode(true) as DocumentFragment;
        const img = card.querySelector('img');
        const name = card.querySelector('h3');
        const status = card.querySelector('.player-status');
        const indicator = card.querySelector('.status-indicator');

        if (img) img.src = player.avatar;
        if (name) name.textContent = player.username;
        if (status) status.textContent = player.ready ? 'Ready' : 'Not Ready';
        if (indicator) indicator.classList.add(player.ready ? 'bg-green-500' : 'bg-yellow-500');

        playersList.appendChild(card);
    }
}

function updatePlayersCount(): void {
    const count = document.getElementById('players-count');
    const totalPlayers = getTournamentState().players.length + (currentPlayer ? 1 : 0);
    if (count) count.textContent = `${totalPlayers}/4`;
}

function updateTournamentStatus(): void {
    const status = document.getElementById('tournament-status');
    const totalPlayers = getTournamentState().players.length + (currentPlayer ? 1 : 0);
    const allReady = currentPlayer?.ready && getTournamentState().players.every(p => p.ready);

    if (status) {
        if (totalPlayers < 4) {
            status.textContent = `Waiting for players (${totalPlayers}/4)`;
            status.className = 'text-lg text-yellow-500';
        } else if (!allReady) {
            status.textContent = 'Waiting for all players to be ready';
            status.className = 'text-lg text-yellow-500';
        } else {
            status.textContent = 'All players ready!';
            status.className = 'text-lg text-green-500';
        }
    }
}

function updateUI(): void {
    updateCurrentPlayer();
    updatePlayersList();
    updatePlayersCount();
    updateTournamentStatus();
}

function toggleReady(): void {
    const tournamentId = getTournamentState().tournamentId;

    console.log('Toggle ready', tournamentId);
    if (!currentPlayer || !gameSocket || !tournamentId) return;

    const newReady = !currentPlayer.ready;
    gameSocket.send(JSON.stringify({
        type: 'toggle_ready',
        payload: { tournamentId, ready: newReady }
    }));

    currentPlayer.ready = newReady;
    updateCurrentPlayer();
    updateTournamentStatus();
}

function leaveTournament(): void {
    const tournamentId = getTournamentState().tournamentId;
    if (gameSocket && tournamentId) {
        gameSocket.send(JSON.stringify({
            type: 'leave_tournament',
            payload: { tournamentId }
        }));
    }
    redirectTo('/');
}

export function initializeChampionship(): void {
    console.log('Initializing championship page');
    gameSocket = UserState.getGameSocket();
    if (!gameSocket) {
        showAlert('Game socket not available', 'danger');
        return;
    }

    if (messageListener) gameSocket.removeEventListener('message', messageListener);
    if (championshipGameEventHandler) UserState.offGameEvent(championshipGameEventHandler);

    const leaveBtn = document.getElementById('leave-btn');
    const readyBtn = document.getElementById('ready-btn');

    console.log("Butonst atus", leaveBtn, readyBtn);
    if (!leaveBtn || !readyBtn) {
        showAlert('Buttons not found', 'danger');
        return;
    }

    trackedAddEventListener(leaveBtn, 'click', leaveTournament);
    trackedAddEventListener(readyBtn, 'click', toggleReady);
    // leaveBtn?.addEventListener('click', leaveTournament);
    // readyBtn?.addEventListener('click', toggleReady);

    const tournamentId = UserState.getGameMode()?.tournamentId;
    if (tournamentId) {
        gameSocket.send(JSON.stringify({ type: 'join_tournament', payload: { tournamentId } }));
    } else {
        gameSocket.send(JSON.stringify({ type: 'create_tournament', payload: {} }));
    }

    updateCurrentPlayer();

    messageListener = (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        switch (data.type) {
            case 'tournament_created':
            case 'new_tournament_created':
                updateTournamentState({ tournamentId: data.payload.tournamentId });
                break;
            case 'tournament_state_update':
                updateTournamentState(data.payload);
                break;
            case 'player_joined':
                updateTournamentState({ players: data.payload.players });
                break;
            case 'player_ready':
                updateTournamentState({ players: data.payload.players });
                break;
            case 'player_left':
                updateTournamentState({ players: data.payload.players });
                break;
            case 'tournament_completed':
                showAlert(`Tournament finished!`);
                redirectTo('/');
                break;
        }
    };
    
    gameSocket.addEventListener('message', messageListener);

    championshipGameEventHandler = (event: GameEvent) => {
        if (event.type === 'tournament_completed') {
            showAlert(`Tournament completed!`);
            redirectTo('/');
        }
    };
    UserState.onGameEvent(championshipGameEventHandler);

    updateUI();
}

export function disposeChampionshipPage(): void {
    if (championshipGameEventHandler) UserState.offGameEvent(championshipGameEventHandler);
    if (messageListener && gameSocket) gameSocket.removeEventListener('message', messageListener);
}