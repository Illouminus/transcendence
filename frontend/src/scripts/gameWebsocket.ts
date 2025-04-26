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

let socket : WebSocket | null = null;
let tournamentProgressModal: HTMLElement | null = null;

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
              //redirectTo('/pong');
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
            const currentUser = UserState.getUser();
            const opponentId = clientGameState.player1.id === currentUser?.id
              ? clientGameState.player2.id
              : clientGameState.player1.id;
            const opponent = currentUser?.friends?.find(f => f.friend_id === opponentId);
            if (!currentUser || !opponent) return;
          
            showGameIntroWithPlayers(data.payload.gameId, {
              id: currentUser.id,
              username: currentUser.username,
              avatar: "http://localhost:8080/user" + (currentUser.avatar || '/images/default_avatar.png')
            }, {
              id: opponent.friend_id,
              username: opponent.friend_username,
              avatar: "http://localhost:8080/user" + (opponent.friend_avatar || '/images/default_avatar.png')
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
          if (data.game_type === 'tournament') {
            tournamentProgressModal = showTournamentProgress();
            setTimeout(() => {
              redirectTo('/'); // очистится всё и будет готовность к новому матчу
            }, 2000);
          } else {
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
          }

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
          console.log('Tournament state update:', data.payload);
          UserState.notifyGameEvent({
            type: 'tournament_state_update',
            tournamentState: data.payload
          });
          break;

        case 'tournament_match_start':

          if (tournamentProgressModal) {
            fadeOutTailwind(tournamentProgressModal, () => {
              tournamentProgressModal = null;
            });
          }

          const previousTournamentState = UserState.getTournamentState();


    

         
          if (previousTournamentState) {
            UserState.setTournamentState({
              ...previousTournamentState,
              matches: {
                semifinals: data.payload.matches.semifinals,
                final: data.payload.matches.final
              } // <-- вот здесь обновляем матчи в состоянии
            });
          }
          
          console.log('Tournament match start:', UserState.getTournamentState());

          showTournamentProgress();

          setTimeout(() => {}, 2000);

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
          const opponentU = currentUserI.friends?.find(f => f.friend_id === data.payload.opponentId);
          if (!opponentU) return;
          clientGameState.player1.id = data.payload.isPlayer1 ? data.payload.opponentId : UserState.getUser()!.id ;
          clientGameState.player2.id = data.payload.isPlayer1 ? UserState.getUser()!.id : data.payload.opponentId;  
          clientGameState.gameId = data.payload.gameId;
          UserState.setGameMode({ mode: 'championship' });
          //redirectTo('/pong');
          showGameIntroWithPlayers(data.payload.gameId, {
            id: currentUserI.id,
            username: currentUserI.username,
            avatar: "http://localhost:8080/user" + (currentUserI.avatar || '/images/default_avatar.png')
          }, {
            id: opponentU.friend_id,
            username: opponentU.friend_username,
            avatar: "http://localhost:8080/user" + (opponentU.friend_avatar || '/images/default_avatar.png')
          });
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