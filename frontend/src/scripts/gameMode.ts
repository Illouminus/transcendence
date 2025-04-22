import { UserState } from './userState';
import { showAlert } from './services/alert.service';
import { redirectTo } from './router';

export type GameMode = 'vsComputer' | 'vsFriend' | 'championship';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GameModeSelection {
    mode: GameMode;
    difficulty?: Difficulty;
    friendId?: string;
    tournamentId?: number;
}

interface Friend {
    friend_id: number;
    friend_username: string;
    friend_avatar: string;
    status: string;
    online?: boolean;
}

let selectedCard: Element | null = null;
let invitationPending = false;

// Initialize the game mode selection page
export function initializeGameModeSelection(): void {
    const cards = document.querySelectorAll('[data-mode]');
    
    // Populate friends list
    populateFriendsList();
    
    // Setup WebSocket listeners for game invitations
    setupWebSocketListeners();
    
    // Subscribe to game events
    UserState.onGameEvent((event) => {
        switch (event.type) {
            case 'invitation_rejected':
                // Reset button state
                const button = document.querySelector(`[data-mode="vsFriend"] button`) as HTMLButtonElement;
                if (button) {
                    button.textContent = 'Start Game';
                    button.disabled = false;
                    button.classList.remove('bg-gray-600', 'cursor-not-allowed');
                }
                invitationPending = false;
                break;
            case 'invitation_accepted':
                // Game will start, no need to reset UI
                invitationPending = false;
                break;
            case 'tournament_created':
                if (event.tournamentId) {
                    // Save tournamentId in UserState
                    const currentMode = UserState.getGameMode();
                    if (currentMode) {
                        UserState.setGameMode({
                            ...currentMode,
                            tournamentId: event.tournamentId
                        });
                    }
                    // Redirect to championship waiting room
                    redirectTo('/championship');
                }
                break;
        }
    });
    
    // Listen for WebSocket connection/disconnection events
    UserState.onConnectionChange(() => {
        populateFriendsList();
    });
    
    // Активируем карточку чемпионата
    const championshipCard = document.querySelector('[data-mode="championship"]');
    if (championshipCard) {
        const button = championshipCard.querySelector('button');
        if (button) {
            button.textContent = 'Start Game';
            button.disabled = false;
            button.classList.remove('cursor-not-allowed', 'opacity-50');
            button.classList.add('hover:bg-purple-700', 'bg-purple-600');
        }
    }
    
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const mode = card.getAttribute('data-mode') as GameMode;
            handleCardSelection(card, mode);
        });

        // Add event listeners for buttons
        const button = card.querySelector('button');
        if (button) {
            button.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card click
                if (button.classList.contains('cursor-not-allowed')) return;
                handleGameStart(card, button);
            });
        }

        // Add event listeners for selects
        const select = card.querySelector('select');
        if (select) {
            select.addEventListener('change', (e) => {
                e.stopPropagation(); // Prevent card click
            });
        }
    });
}

function setupWebSocketListeners(): void {
    const gameSocket = UserState.getGameSocket();
    if (!gameSocket) return;

    gameSocket.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'game_invite_response') {
            handleGameInviteResponse(data.payload);
        }
    });
}

function handleGameInviteResponse(payload: { accepted: boolean, friendId: number }): void {
    invitationPending = false;
    const button = document.querySelector(`[data-mode="vsFriend"] button`) as HTMLButtonElement;
    
    if (payload.accepted) {
        showAlert('Friend accepted your invitation!', 'success');
        // Save game mode and redirect
        const selection: GameModeSelection = {
            mode: 'vsFriend',
            friendId: payload.friendId.toString()
        };
        UserState.setGameMode(selection);
        redirectTo('/pong');
    } else {
        showAlert('Friend declined your invitation', 'warning');
        // Reset button state
        if (button) {
            button.textContent = 'Start Game';
            button.disabled = false;
            button.classList.remove('bg-gray-600', 'cursor-not-allowed');
        }
    }
}

// Populate friends list in the select element
function populateFriendsList(): void {
    const friendSelect = document.querySelector('[data-mode="vsFriend"] select') as HTMLSelectElement;
    if (!friendSelect) return;

    // Clear existing options except the first one
    while (friendSelect.options.length > 1) {
        friendSelect.remove(1);
    }

    const user = UserState.getUser();
    const friends = user?.friends || [];

    // Sort friends by online status and then by username
    const sortedFriends = [...friends].sort((a, b) => {
        if (a.online && !b.online) return -1;
        if (!a.online && b.online) return 1;
        return a.friend_username.localeCompare(b.friend_username);
    });

    sortedFriends.forEach(friend => {
        const option = document.createElement('option');
        option.value = friend.friend_id.toString();
        option.textContent = `${friend.friend_username} ${friend.online ? '(Online)' : '(Offline)'}`;
        option.classList.add(friend.online ? 'text-green-400' : 'text-gray-400');
        if (!friend.online) {
            option.disabled = true;
        }
        friendSelect.appendChild(option);
    });

    // If no friends, add a disabled option
    if (friends.length === 0) {
        const option = document.createElement('option');
        option.value = "";
        option.textContent = "No friends available";
        option.disabled = true;
        friendSelect.appendChild(option);
    }
}

// Handle card selection
function handleCardSelection(card: Element, mode: GameMode): void {
    if (invitationPending) return; // Prevent selection while invitation is pending

    // Remove selection from previous card
    if (selectedCard && selectedCard !== card) {
        selectedCard.classList.remove('selected');
        selectedCard.classList.remove('border-purple-500');
        const prevButton = selectedCard.querySelector('button');
        if (prevButton) {
            prevButton.classList.add('opacity-0');
        }
    }

    // Select new card
    selectedCard = card;
    card.classList.add('selected');
    card.classList.add('border-purple-500');
    
    const button = card.querySelector('button');
    if (button) {
        button.classList.remove('opacity-0');
    }
}

// Handle game start
async function handleGameStart(card: Element, button: Element): Promise<void> {
    if (invitationPending) return;

    const mode = card.getAttribute('data-mode') as GameMode;
    let selection: GameModeSelection = { mode };

    // Get game socket once for all cases
    const gameSocket = UserState.getGameSocket();
    if (!gameSocket) {
        showAlert('Game socket not available', 'danger');
        return;
    }

    switch (mode) {
        case 'vsComputer':
            const difficultySelect = card.querySelector('select') as HTMLSelectElement;
            const difficulty = difficultySelect.value as Difficulty;
            selection.difficulty = difficulty;

            try {
                // Send request to start AI game
                gameSocket.send(JSON.stringify({ 
                    type: 'start_ai_game',
                    payload: { difficulty }
                }));

                // Save game mode selection
                UserState.setGameMode(selection);

                // Show loading state
                const startButton = button as HTMLButtonElement;
                startButton.textContent = 'Starting game...';
                startButton.disabled = true;
                startButton.classList.add('bg-gray-600', 'cursor-not-allowed');

                // Wait for game creation confirmation
                await new Promise<void>((resolve) => {
                    const listener = (event: MessageEvent) => {
                        const data = JSON.parse(event.data);
                        if (data.type === 'game_created') {
                            gameSocket.removeEventListener('message', listener);
                            resolve();
                        }
                    };
                    gameSocket.addEventListener('message', listener);
                });

                // Redirect to game
                redirectTo('/pong');
            } catch (error) {
                console.error('Error starting AI game:', error);
                showAlert('Failed to start game', 'danger');
                
                // Reset button state
                const startButton = button as HTMLButtonElement;
                startButton.textContent = 'Start Game';
                startButton.disabled = false;
                startButton.classList.remove('bg-gray-600', 'cursor-not-allowed');
            }
            break;

        case 'vsFriend':
            const friendSelect = card.querySelector('select') as HTMLSelectElement;
            const friendId = friendSelect.value;
            if (!friendId) {
                showAlert('Please select a friend', 'warning');
                return;
            }

            // Check if selected friend is online
            const selectedOption = friendSelect.selectedOptions[0];
            if (selectedOption.disabled) {
                showAlert('Selected friend is offline', 'warning');
                return;
            }

            try {
                invitationPending = true;
                gameSocket.send(JSON.stringify({ 
                    type: 'game_invite', 
                    payload: { friendId: parseInt(friendId) }
                }));

                // Update button state
                const startButton = button as HTMLButtonElement;
                startButton.textContent = 'Waiting for response...';
                startButton.disabled = true;
                startButton.classList.add('bg-gray-600', 'cursor-not-allowed');

                showAlert('Game invitation sent!', 'info');
            } catch (error) {
                console.error('Error sending game invitation:', error);
                showAlert('Failed to send game invitation', 'danger');
                invitationPending = false;
            }
            break;

        case 'championship':
            try {
                // Save game mode selection
                UserState.setGameMode(selection);

                // Show loading state
                const startButton = button as HTMLButtonElement;
                startButton.textContent = 'Joining championship...';
                startButton.disabled = true;
                startButton.classList.add('bg-gray-600', 'cursor-not-allowed');

                // Redirect to championship waiting room
                redirectTo('/championship');
            } catch (error) {
                console.error('Error joining championship:', error);
                showAlert('Failed to join championship', 'danger');
                
                // Reset button state
                const startButton = button as HTMLButtonElement;
                startButton.textContent = 'Start Game';
                startButton.disabled = false;
                startButton.classList.remove('bg-gray-600', 'cursor-not-allowed');
            }
            break;
    }
}