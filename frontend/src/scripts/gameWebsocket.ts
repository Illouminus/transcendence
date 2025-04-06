import { loadFriendRequests, loadFriends } from "./friends";
import { fetchAllUsers, updateUser } from "./loaders/outils";
import { GameWebSocketMessage } from "./models/websocket.model";
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
    
      console.log('WebSocket message:', data);
      showAlert(data.type);
      switch (data.type) {
        case 'game_invitation_income': {
          showAlert(`You have a new game request from ${UserState.getUser()?.friends?.find(friend => friend.friend_id === data.payload.fromUserId)?.friend_username}`);
          await updateUser();
          loadFriendRequests();
          break;
        }
    
    
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