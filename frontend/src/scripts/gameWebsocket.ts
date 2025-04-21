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

let socket : WebSocket | null = null;

export function connectGameWebSocket(token: string): WebSocket {
  
    if (socket && socket.readyState === WebSocket.OPEN) {
      return socket;
    } 
    socket = new WebSocket(`ws://localhost:8083/ws?token=${token}`);

    socket.onopen = () => {
      console.log("WebSocket connection established");
    };
    socket.onclose = () => {
      console.log("WebSocket connection closed");
      socket = null;
    };
    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
    };
    socket.onmessage = async (event) => {
      const data: GameWebSocketMessage = JSON.parse(event.data);
      showAlert(data.type);
      switch (data.type) {
        case 'game_invitation_income': {
          const gameInvitationModal = createGameInvitationModal();
          const friend = UserState.getUser()?.friends?.find(friend => friend.friend_id === data.payload.fromUserId);
          if (friend) {
            showAlert(`You have a new game invitation from ${friend.friend_username}`);
            gameInvitationModal.show(friend, () => {
              socket?.send(JSON.stringify({ type: 'game_invitation_accepted', payload: { friendId: data.payload.fromUserId } }));
              clientGameState.player1.id = data.payload.fromUserId;
              clientGameState.player2.id = UserState.getUser()!.id;
              redirectTo('/pong');
            }, () => {
              socket?.send(JSON.stringify({ type: 'game_invitation_rejected', payload: { friendId: data.payload.fromUserId } }));
            });
          }
          await updateUser();
          loadFriendRequests();
          break;
        }
        case 'game_invitation_accepted':
          showAlert(`Game invitation accepted by ${data.payload.fromUserId}`);
          UserState.notifyGameEvent({
            type: 'invitation_accepted',
            friendId: data.payload.fromUserId
          });
          clientGameState.player1.id = UserState.getUser()!.id;
          clientGameState.player2.id = data.payload.fromUserId;
          redirectTo('/pong');
          break;
        case 'game_invitation_rejected':
          showAlert(`Game invitation rejected by ${data.payload.fromUserId}`);
          UserState.notifyGameEvent({
            type: 'invitation_rejected',
            friendId: data.payload.fromUserId
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
          console.log('Game result:', data);
          UserState.notifyGameEvent({
            type: 'game_result',
            gameResult: {
              winnerId: data.payload.winnerId,
              score1: data.payload.score1,
              score2: data.payload.score2
            }
          });
          break;
        case 'tournament_created':
          UserState.notifyGameEvent({
            type: 'tournament_created',
            tournamentId: data.payload.tournamentId
          });
          break;
        case 'new_tournament_created':
          console.log('New tournament created:', data);
          UserState.setGameMode({ mode: 'championship', tournamentId: data.payload.tournamentId });
          
          // UserState.notifyGameEvent({
          //   type: 'new_tournament_created',
          //   tournamentId: data.payload.tournamentId,
          // });
          console.log("GME MODE", UserState.getGameMode());
          break;

        case 'tournament_state_update':
          UserState.notifyGameEvent({
            type: 'tournament_state_update',
            tournamentState: data.payload
          });
          break;

        case 'tournament_match_start':
          UserState.notifyGameEvent({
            type: 'tournament_match_start',
            tournamentMatch: {
              opponentId: data.payload.opponentId,
              gameId: data.payload.gameId,
              matchType: data.payload.matchType
            }
          });
          clientGameState.player1.id = UserState.getUser()!.id;
          clientGameState.player2.id = data.payload.opponentId;
          clientGameState.gameId = data.payload.gameId;
          UserState.setGameMode({ mode: 'championship' });
          redirectTo('/pong');
          break;

        case 'tournament_match_complete':
          // Обработка завершения матча, но не перенаправляем пользователя
          // Ждем следующего события tournament_match_start или tournament_completed
          break;

        case 'tournament_completed':
          UserState.notifyGameEvent({
            type: 'tournament_completed',
            tournamentResult: {
              place: data.payload.podium.find(p => p.userId === UserState.getUser()?.id)?.place || 0,
              podium: data.payload.podium
            }
          });
          redirectTo('/game'); // Возвращаемся в главное меню
          break;
      }
    };
    return socket;
}
  
export function getWebSocket(): WebSocket | null {
  return socket;
}