import { UserState } from './userState';
import { showAlert } from './services/alert.service';
import { redirectTo } from './router';

interface Player {
    id: number;
    username: string;
    avatar: string;
    ready: boolean;
    isHost?: boolean;
}

// Состояние чемпионата
let players: Player[] = [];
let countdownInterval: number | null = null;
let startTime: number | null = null;
let gameSocket: WebSocket | null = null;
let currentPlayer: Player | null = null;

// Обновление UI текущего игрока
function updateCurrentPlayer(): void {
    const user = UserState.getUser();
    if (!user) return;

    currentPlayer = {
        id: user.id,
        username: user.username,
        avatar: user.avatar || '/images/default_avatar.png',
        ready: false,
        isHost: players.length === 0 // Первый игрок становится хостом
    };

    const avatarElement = document.getElementById('current-player-avatar') as HTMLImageElement;
    const nameElement = document.getElementById('current-player-name');
    const readyElement = document.getElementById('current-player-ready');
    const statusElement = document.getElementById('current-player-status');

    if (avatarElement) {
        avatarElement.src = "http://localhost:8080/user" + currentPlayer.avatar;
        avatarElement.alt = `${currentPlayer.username}'s avatar`;
    }

    if (nameElement) {
        nameElement.textContent = currentPlayer.username;
    }

    if (readyElement) {
        readyElement.textContent = currentPlayer.ready ? 'Ready' : 'Not Ready';
        readyElement.className = currentPlayer.ready 
            ? 'px-3 py-1 rounded-full text-sm font-medium bg-green-500 text-white'
            : 'px-3 py-1 rounded-full text-sm font-medium bg-yellow-500 text-gray-900';
    }

    if (statusElement) {
        statusElement.className = `absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-gray-800 ${
            currentPlayer.ready ? 'bg-green-500' : 'bg-yellow-500'
        }`;
    }
}

// Обработчики WebSocket событий
function handlePlayerJoined(player: Player): void {
    if (player.id === currentPlayer?.id) return; // Не добавляем текущего игрока в список других игроков
    players.push(player);
    updatePlayersList();
    updatePlayersCount();
    updateTournamentStatus();
}

function handlePlayerLeft(playerId: number): void {
    players = players.filter(p => p.id !== playerId);
    updatePlayersList();
    updatePlayersCount();
    updateTournamentStatus();
}

function handlePlayerReady(payload: { playerId: number, ready: boolean }): void {
    if (payload.playerId === currentPlayer?.id) {
        if (currentPlayer) {
            currentPlayer.ready = payload.ready;
            updateCurrentPlayer();
        }
    } else {
        const player = players.find(p => p.id === payload.playerId);
        if (player) {
            player.ready = payload.ready;
            updatePlayersList();
        }
    }
    updateTournamentStatus();
}

function handleTournamentStarting(payload: { startTime: number }): void {
    startTime = payload.startTime;
    updateStatus('Tournament starting soon!', 'green');
    startCountdown();
}

function handleTournamentStarted(): void {
    stopCountdown();
    redirectTo('/pong');
}

function handleTournamentCancelled(): void {
    stopCountdown();
    showAlert('Tournament cancelled - not enough players', 'warning');
    redirectTo('/game');
}

// Обновление UI
function updatePlayersList(): void {
    const playersList = document.getElementById('players-list');
    const template = document.getElementById('player-card-template') as HTMLTemplateElement;
    
    if (!playersList || !template) return;

    playersList.innerHTML = '';
    
    players.forEach(player => {
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

function updatePlayersCount(): void {
    const countElement = document.getElementById('players-count');
    if (countElement) {
        const totalPlayers = players.length + (currentPlayer ? 1 : 0);
        countElement.textContent = `${totalPlayers}/4`;
    }
}

function updateStatus(status: string, type: 'yellow' | 'green' | 'red' = 'yellow'): void {
    const statusElement = document.getElementById('tournament-status');
    const indicatorElement = document.getElementById('tournament-status-indicator');
    
    if (statusElement) {
        statusElement.textContent = status;
        statusElement.className = `text-lg text-${type}-500`;
    }

    if (indicatorElement) {
        indicatorElement.className = `w-3 h-3 rounded-full animate-pulse bg-${type}-500`;
    }
}

function updateTournamentStatus(): void {
    const totalPlayers = players.length + (currentPlayer ? 1 : 0);
    const allReady = currentPlayer?.ready && players.every(p => p.ready);

    if (totalPlayers < 4) {
        updateStatus(`Waiting for players (${totalPlayers}/4)`, 'yellow');
    } else if (!allReady) {
        updateStatus('Waiting for all players to be ready', 'yellow');
    } else {
        updateStatus('All players ready!', 'green');
    }
}

// Управление таймером
function startCountdown(): void {
    if (!startTime) return;

    const updateTimer = () => {
        const now = Date.now();
        const timeLeft = Math.max(0, startTime! - now);
        
        const seconds = Math.floor(timeLeft / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        const timeElement = document.getElementById('time-until-start');
        if (timeElement) {
            timeElement.textContent = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
    };

    countdownInterval = window.setInterval(updateTimer, 1000);
    updateTimer();
}

function stopCountdown(): void {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
}

// Действия пользователя
function leaveTournament(): void {
    if (gameSocket) {
        gameSocket.send(JSON.stringify({
            type: 'leave_tournament'
        }));
    }
    redirectTo('/game');
}

function toggleReady(): void {
    if (!currentPlayer || !gameSocket) return;

    const newReadyState = !currentPlayer.ready;
    gameSocket.send(JSON.stringify({
        type: 'toggle_ready'
    }));

    // Оптимистичное обновление UI
    currentPlayer.ready = newReadyState;
    updateCurrentPlayer();
    updateTournamentStatus();
}

// Основная функция инициализации
export function initializeChampionship(): void {
    gameSocket = UserState.getGameSocket();
    if (!gameSocket) {
        showAlert('Game socket not available', 'danger');
        return;
    }

    // Инициализация текущего игрока
    updateCurrentPlayer();

    // Настройка обработчиков событий кнопок
    const leaveBtn = document.getElementById('leave-btn');
    const readyBtn = document.getElementById('ready-btn');
    
    leaveBtn?.addEventListener('click', leaveTournament);
    readyBtn?.addEventListener('click', toggleReady);

    // Настройка WebSocket слушателей
    gameSocket.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
            case 'player_joined':
                handlePlayerJoined(data.payload);
                break;
            case 'player_left':
                handlePlayerLeft(data.payload);
                break;
            case 'player_ready':
                handlePlayerReady(data.payload);
                break;
            case 'tournament_starting':
                handleTournamentStarting(data.payload);
                break;
            case 'tournament_started':
                handleTournamentStarted();
                break;
            case 'tournament_cancelled':
                handleTournamentCancelled();
                break;
        }
    });

    // Инициализация начального состояния
    updateStatus('Waiting for players', 'yellow');
    updatePlayersCount();
    updateTournamentStatus();
}

