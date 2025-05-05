import { GameEvent, UserState } from './userState';
import { showAlert } from './services/alert.service';
import { redirectTo } from './router';
import { TournamentState } from './types/tournament.types';
import { trackedAddEventListener } from './outils/eventManager';
import { getUserById } from './outils/outils';
import { BASE_URL } from './outils/config';

interface Player {
    id: number;
    username: string;
    avatar: string;
    ready: boolean;
    isHost: boolean;
}

export let championshipGameEventHandler: ((event: GameEvent) => void) | null = null;
let messageListener: ((event: MessageEvent) => void) | null = null;
let gameSocket: WebSocket | null = null;
let currentPlayer: Player | null = null;
let userAlias: string | null = null;
let waitingForTournamentRecovery = false;

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

export function updateTournamentState(newState: Partial<TournamentState>): void {
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

    // Получаем актуального игрока из состояния турнира
    const playerFromState = getTournamentState().players.find(p => p.id === user.id);

    currentPlayer = {
        id: user.id,
        username: UserState.getTournamentAlias() || user.username,
        avatar: user.avatar || '/images/default_avatar.png',
        ready: playerFromState ? playerFromState.ready : false,
        isHost: false,
    };

    const avatar = document.getElementById('current-player-avatar') as HTMLImageElement;
    const name = document.getElementById('current-player-name');
    const ready = document.getElementById('current-player-ready');
    const status = document.getElementById('current-player-status');

    if (avatar) avatar.src = `${BASE_URL}/user${currentPlayer.avatar}`;
    if (name) name.textContent = currentPlayer.username;
    if (ready) {
        ready.textContent = currentPlayer.ready ? 'Ready' : 'Not Ready';
        ready.className = `px-3 py-1 rounded-full text-sm font-medium ${currentPlayer.ready ? 'bg-green-500' : 'bg-yellow-500'} text-gray-900`;
    }
    if (status) {
        status.className = `absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-gray-800 ${currentPlayer.ready ? 'bg-green-500' : 'bg-yellow-500'}`;
    }
}

function updatePlayersList(): void {
    const playersList = document.getElementById('players-list');
    const template = document.getElementById('player-card-template') as HTMLTemplateElement;
    if (!playersList || !template) return;

    playersList.innerHTML = '';
    const players = getTournamentState().players;
    
    // Фильтруем текущего игрока из списка
    const otherPlayers = players.filter(p => p.id !== currentPlayer?.id );
    
    for (const player of otherPlayers) {
        const playerInfo = getUserById(player.id);
        if (!playerInfo) continue;

        const card = template.content.cloneNode(true) as DocumentFragment;
        const img = card.querySelector('img');
        const name = card.querySelector('h3');
        const status = card.querySelector('.player-status');
        const indicator = card.querySelector('.status-indicator');

        if (img) img.src =  `${BASE_URL}/user${playerInfo.avatar_url}` || '/images/default_avatar.png';
        if (name) name.textContent = player.alias || playerInfo.username || "Anonymous";
        if (status) status.textContent = player.ready ? 'Ready' : 'Not Ready';
        if (indicator) {
            indicator.classList.remove('bg-green-500', 'bg-yellow-500');
            indicator.classList.add(player.ready ? 'bg-green-500' : 'bg-yellow-500');
        }
        playersList.appendChild(card);
    }
}

function updatePlayersCount(): void {
    const count = document.getElementById('players-count');
    const totalPlayers = getTournamentState().players.length;
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
    if (!currentPlayer || !gameSocket || !tournamentId) return;

    const newReady = !currentPlayer.ready;
    gameSocket.send(JSON.stringify({
        type: 'toggle_ready',
        payload: { tournamentId, ready: newReady }
    }));

    currentPlayer.ready = newReady;
    updateCurrentPlayer();
    
    // Отключаем кнопки после нажатия
    const readyBtn = document.getElementById('ready-btn') as HTMLButtonElement;
    const leaveBtn = document.getElementById('leave-btn') as HTMLButtonElement;
    if (readyBtn) readyBtn.disabled = true;
    if (leaveBtn) leaveBtn.disabled = true;
}

function leaveTournament(): void {
    const tournamentId = getTournamentState().tournamentId;

    console.log("Leaving tournament", tournamentId);
    if (gameSocket && tournamentId) {
        gameSocket.send(JSON.stringify({
            type: 'left_tournament',
            payload: { tournamentId }
        }));
        
        // Отключаем кнопки после нажатия
        const readyBtn = document.getElementById('ready-btn') as HTMLButtonElement;
        const leaveBtn = document.getElementById('leave-btn') as HTMLButtonElement;
        if (readyBtn) readyBtn.disabled = true;
        if (leaveBtn) leaveBtn.disabled = true;
    }

    // Clear tournament state
    UserState.setTournamentState({
        tournamentId: null,
        phase: 'waiting',
        players: [],
    });
    UserState.setTournamentAlias("");
    userAlias = null;
    currentPlayer = null;
    redirectTo('/');
}

function showAliasModal(onSubmit: (alias: string) => void) {
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(0,0,0,0.7)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '9999';
    modal.innerHTML = `
      <div style="background:#222;padding:32px 40px;border-radius:16px;color:white;min-width:320px;text-align:center;">
        <div style="font-size:1.5rem;margin-bottom:16px;">Enter your alias</div>
        <input id="alias-input" type="text" style="padding:8px 12px;border-radius:8px;border:none;width:80%;margin-bottom:16px;" maxlength="20" autofocus />
        <br>
        <button id="alias-submit" style="padding:8px 24px;border-radius:8px;background:#4f46e5;color:white;font-weight:bold;border:none;">Join</button>
      </div>
    `;
    document.body.appendChild(modal);

    const input = modal.querySelector('#alias-input') as HTMLInputElement;
    const btn = modal.querySelector('#alias-submit') as HTMLButtonElement;


    btn.onclick = () => {
        if (input.value.trim()) {
            onSubmit(input.value.trim());
            modal.remove();
        }
    };
    input.onkeydown = (e) => {
        if (e.key === 'Enter' && input.value.trim()) {
            onSubmit(input.value.trim());
            modal.remove();
        }
    };
    modal.onclick = (e) => {
        if (e.target === modal) {
            onSubmit(input.value.trim());
            modal.remove();
        }
    };
    input.focus();
}

function joinTournamentWithAlias(tournamentId: number, alias: string) {
    if (!gameSocket) return;
    gameSocket.send(JSON.stringify({
        type: 'join_tournament',
        payload: { tournamentId, alias }
    }));
}

export function initializeChampionship(): void {
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

    // let responded = false;
    // const tournamentId = UserState.getGameMode()?.tournamentId;
    // if (!tournamentId) {
    //     gameSocket.send(JSON.stringify({ type: 'get_my_tournament' }));
    
    // setTimeout(() => {
    //         if (!responded) {
    //             showAliasModal((alias) => {
    //                 alias = alias.trim() || UserState.getUser()?.username || 'Anonymous';
    //                 UserState.setTournamentAlias(alias);
    //                 gameSocket?.send(JSON.stringify({ type: 'create_tournament', payload: { alias } }));
    //             });
    //         }
    //     }, 1000);   
    // }

    showAliasFlowIfNotAlreadyInTournament();
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
            case 'tournament_player_left':
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


function showAliasFlowIfNotAlreadyInTournament() {
	const userId = UserState.getUser()?.id;
	if (!userId) return;

	if (!getTournamentState().players.some(p => p.id === userId)) {
		showAliasModal((alias) => {
			if(alias.length < 1) {
				alias = UserState.getUser()?.username || 'Anonymous';
			}
			userAlias = alias.trim();
			UserState.setTournamentAlias(alias);

            const tournamentId = UserState.getTournamentState()?.tournamentId;
			if (tournamentId) {
				joinTournamentWithAlias(tournamentId, alias);
			} else {
				gameSocket?.send(JSON.stringify({ type: 'create_tournament', payload: { alias } }));
			}
		});
	}
}