import { loadFriendRequests, loadFriends } from "./friends";
import { createGameInvitationModal } from "./gameInvitationModal";
import { fetchAllUsers, updateUser } from "./loaders/outils";
import { GameWebSocketMessage } from "./models/websocket.model";
import { clientGameState } from "./pong";
import { redirectTo } from "./router";
import { showAlert } from "./services/alert.service";
import { fetchUsers } from "./users";
import { UserState } from "./userState";

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
          console.log('friend ivited to game', friend);
          if (friend) {
            showAlert(`You have a new game invitation from ${friend.friend_username}`);
            gameInvitationModal.show(friend, () => {
              socket?.send(JSON.stringify({ type: 'game_invitation_accepted', payload: { friendId: data.payload.fromUserId } }));
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
          const gameId = data.payload.gameId;
          clientGameState.gameId = gameId;
          
          redirectTo('/pong');
          break;
        case 'game_invitation_rejected':
          showAlert(`Game invitation rejected by ${data.payload.fromUserId}`);
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
          // Handle game result
          console.log('Game result:', data);
          break;
    
      //   default:
      //     console.warn('Unknown WS message type:', data);
      // }
    };

  }
  return socket;
}
  
  export function getWebSocket(): WebSocket | null {
    return socket;
  }