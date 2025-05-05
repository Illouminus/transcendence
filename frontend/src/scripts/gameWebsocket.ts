import { loadFriendRequests, loadFriends } from "./friends";
import { createGameInvitationModal } from "./gameInvitationModal";
import { fetchAllUsers, updateUser } from "./loaders/outils";
import { GameWebSocketMessage } from "./models/websocket.model";
import { clientGameState } from "./pong";
import { redirectTo } from "./router";
import { showAlert } from "./services/alert.service";
import { fetchUsers } from "./users";
import { UserState } from "./userState";
import { showGameOverModal } from "./endGame";
import { createGameIntro, fadeOutTailwind } from "../components/gameIntro";
import { showGameIntroWithPlayers } from "./outils/showGameIntroWithPlayer";
import { showTournamentProgress } from "./tournament/tournamentProgress";
import { renderPodium } from "./components/podium";
import { removeEliminationWait, renderEliminationWait } from "./components/eliminationWait";
import { BASE_URL, WS_GAME_URL } from "./outils/config";
import { updateTournamentState } from "./championship";

let socket : WebSocket | null = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 10;
const reconnectDelay = 3000; 
let tournamentProgressModal: HTMLElement | null = null;
let gameReadyModal: HTMLElement | null = null;

export function connectGameWebSocket(token: string): WebSocket {
  
    if (socket && socket.readyState === WebSocket.OPEN) {
      return socket;
    } 
    socket = new WebSocket(`${WS_GAME_URL}?token=${token}`);

    socket.onopen = () => {
      console.log("WebSocket connection established");
      socket?.send(JSON.stringify({ type: 'get_my_tournament' }));
      reconnectAttempts = 0;
    };
    socket.onclose = () => {
      console.log("WebSocket connection closed");
      socket = null;

      if (reconnectAttempts < maxReconnectAttempts) {
        setTimeout(() => {
          console.log(`Attempting reconnect (#${reconnectAttempts + 1})`);
          reconnectAttempts++;
          const token = localStorage.getItem("token");
          if (token) {
            const newSocket = connectGameWebSocket(token);
            UserState.setGameSocket(newSocket);
          }
        }, reconnectDelay);
      } else {
        console.warn("Max reconnect attempts reached. Giving up.");
      }
    };
    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
    };
    socket.onmessage = async (event) => {
      const data: GameWebSocketMessage = JSON.parse(event.data);
      if(data.type != 'game_update')
        console.log("WebSocket game message received:", data);
      //showAlert(data.type);
      switch (data.type) {

        case 'game_invitation_income': 
          const gameInvitationModal = createGameInvitationModal();
          const friend = UserState.getUser()?.friends?.find(friend => friend.friend_id === data.payload.fromUserId);
          if (friend) {
            showAlert(`You have a new game invitation from ${friend.friend_username}`);
            gameInvitationModal.show(friend, () => {
              socket?.send(JSON.stringify({ type: 'game_invitation_accepted', payload: { friendId: data.payload.fromUserId } }));
              clientGameState.player1.id = data.payload.fromUserId;
              clientGameState.player2.id = UserState.getUser()!.id;
            }, () => {
              socket?.send(JSON.stringify({ type: 'game_invitation_rejected', payload: { friendId: data.payload.fromUserId } }));
            });
          }
          await updateUser();
          loadFriendRequests();
          break;
        

        case 'game_invitation_accepted':
          showAlert(`Game invitation accepted by ${data.payload.fromUserId}`);
          UserState.notifyGameEvent({
            type: 'invitation_accepted',
            friendId: data.payload.fromUserId
          });
          clientGameState.player1.id = UserState.getUser()!.id;
          clientGameState.player2.id = data.payload.fromUserId;
          break;



        case 'game_invitation_rejected':
          showAlert(`Game invitation rejected by ${data.payload.fromUserId}`);
          UserState.notifyGameEvent({
            type: 'invitation_rejected',
            friendId: data.payload.fromUserId
          });
          break;

          case 'game_created': 
          console.log('Game created:', data);
            const currentUser = UserState.getUser();
            if (!currentUser) return;
            if (data.isAiGame) {
              console.log('AI game created:', data.payload.gameId);
              resetClientGameState(); // Только для AI обнуляем стейт сразу
              clientGameState.player1.id = 0;
              clientGameState.player2.id = currentUser.id;
              clientGameState.player1.score = 0;
              clientGameState.player2.score = 0;
              clientGameState.ball.x = 0;
              clientGameState.ball.y = 0;
              clientGameState.gameId = data.payload.gameId;
              redirectTo('/pong');
              return;
            }
            


            const opponentId = clientGameState.player1.id === currentUser?.id
              ? clientGameState.player2.id
              : clientGameState.player1.id;
            const opponent = currentUser?.friends?.find(f => f.friend_id === opponentId);

            if (!currentUser || !opponent) return;
          
            if(data.isAiGame)
                return;
            showGameIntroWithPlayers(data.payload.gameId, {
              id: currentUser.id,
              username: currentUser.username,
              avatar: `${BASE_URL}/user${currentUser.avatar}` || '/images/default_avatar.png'
            }, {
              id: opponent.friend_id,
              username: opponent.friend_username,
              avatar: `${BASE_URL}/user${opponent.friend_avatar}`  || '/images/default_avatar.png'
            });
            break;
          

        case 'game_countdown':
          const countdownTimer = document.getElementById('countdownTimer');
          if (countdownTimer) {
            countdownTimer.style.display = 'block';
            countdownTimer.textContent = data.payload.count.toString();
            if (data.payload.count === 0) {
              countdownTimer.style.display = 'none';
            }
          }
          break;

        case 'game_update':
          clientGameState.gameId = data.payload.gameId;
          clientGameState.player1.x = data.payload.players.p1.x;
          clientGameState.player1.y = data.payload.players.p1.y;
          clientGameState.player1.score = data.payload.players.p1.score;
          clientGameState.player2.x = data.payload.players.p2.x;
          clientGameState.player2.y = data.payload.players.p2.y;
          clientGameState.player2.score = data.payload.players.p2.score;
          clientGameState.ball.x = data.payload.ball.x;
          clientGameState.ball.y = data.payload.ball.y;
          break;
        case 'game_result':
            showGameOverModal({
              winnerId: data.payload.winnerId,
              score1: data.payload.score1,
              score2: data.payload.score2
            });
            UserState.notifyGameEvent({
              type: 'game_result',
              gameResult: {
                winnerId: data.payload.winnerId,
                score1: data.payload.score1,
                score2: data.payload.score2
              }
            });
          resetClientGameState();

          break;
          case 'tournament_created':
            UserState.setGameMode({ mode: 'championship', tournamentId: data.payload.tournamentId });
            UserState.notifyGameEvent({
              type: 'tournament_created',
              tournamentId: data.payload.tournamentId
            });
            break;
          
          case 'new_tournament_created':
            if (!UserState.getGameMode()?.tournamentId) {
              UserState.setGameMode({ mode: 'championship', tournamentId: data.payload.tournamentId });
            }
            UserState.notifyGameEvent({
              type: 'new_tournament_created',
              tournamentId: data.payload.tournamentId
            });
            break;
        case 'tournament_state_update':
          UserState.setTournamentAlias(data.payload.players.find((p) => p.id === UserState.getUser()?.id)?.alias || UserState.getUser()!.username);
          updateTournamentState(data.payload as any);
          UserState.notifyGameEvent({
            type: 'tournament_state_update',
            tournamentState: data.payload
          });
          break;

        case 'tournament_match_start':
      
        console.log('Tournament match started:', data);
        showAlert(`Tournament match started!`);

          const previousTournamentState = UserState.getTournamentState();
          if (previousTournamentState) {
            UserState.setTournamentState({
              ...previousTournamentState,
              matches: {
                semifinals: data.payload.matches.semifinals,
                final: data.payload.matches.final
              } 
            });
          }
          if (tournamentProgressModal) {
            fadeOutTailwind(tournamentProgressModal, () => {
              tournamentProgressModal = null;
              setTimeout(() => {
                showTournamentProgress();
              }, 1000); // 100ms достаточно
            });
          } else {
            showTournamentProgress();
          }



          UserState.notifyGameEvent({
            type: 'tournament_match_start',
            tournamentMatch: {
              opponentId: data.payload.opponentId,
              gameId: data.payload.gameId,
              matchType: data.payload.matchType
            }
          });

          const currentUserI = UserState.getUser();
          if (!currentUserI) return;
          const opponentU = UserState.getAllUsers().find((u) => u.id === data.payload.opponentId);
          if (!opponentU) return;
          clientGameState.player1.id = data.payload.isPlayer1 ? data.payload.opponentId : UserState.getUser()!.id ;
          clientGameState.player2.id = data.payload.isPlayer1 ? UserState.getUser()!.id : data.payload.opponentId;  
          clientGameState.gameId = data.payload.gameId;
          UserState.setGameMode({ mode: 'championship' });
            showGameIntroWithPlayers(data.payload.gameId, {
            id: currentUserI.id,
            username: UserState.getTournamentAlias() || currentUserI.username,
            avatar: `${BASE_URL}/user${currentUserI.avatar}` || '/images/default_avatar.png'
            }, {
            id: opponentU.id,
            username: data.payload.opponentAlias || opponentU.username,
            avatar: `${BASE_URL}/user${opponentU.avatar_url}` || '/images/default_avatar.png'
            });
          break;

        case 'tournament_match_complete':
          redirectTo('/');
          renderEliminationWait({ ...data.payload, gameId: Number(data.payload.gameId) });
          break;

        case 'tournament_completed':
          removeEliminationWait();
          redirectTo('/');
          renderPodium(data.payload.podium);
          UserState.setTournamentAlias('');
          UserState.setTournamentState({
            tournamentId: null,
            phase: 'waiting',
            players: [],
        });
          UserState.setGameMode({ mode: 'none' });
          break;
        case 'tournament_player_left':
          UserState.notifyGameEvent({
            type: 'tournament_player_left',
            userId: data.payload.userId,
            tournamentId: data.payload.tournamentId
          });
          
        break;
      }
    };
    return socket;
}
  
export function getWebSocket(): WebSocket | null {
  return socket;
}

function resetClientGameState() {
  clientGameState.gameId = 0;
  clientGameState.player1 = { id: 0, x: 0, y: 0, score: 0 };
  clientGameState.player2 = { id: 0, x: 0, y: 0, score: 0 };
  clientGameState.ball = { x: 0, y: 0, velX: 0, velY: 0 };
}