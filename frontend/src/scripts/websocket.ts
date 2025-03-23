import { loadFriendRequests } from "./friends";
import { updateUser } from "./loaders/outils";
import { WebSocketMessage } from "./models/websocket.model";
import { showAlert } from "./services/alert.service";

let socket : WebSocket | null = null;



export function connectWebSocket(token: string): WebSocket {
  
    if (socket && socket.readyState === WebSocket.OPEN) {
      return socket;
    } 
    socket = new WebSocket(`ws://localhost:8082/ws?token=${token}`);
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
      const data: WebSocketMessage = JSON.parse(event.data);
    
      console.log('WebSocket message:', data);
      switch (data.type) {
        case 'incoming_request': {
          showAlert(`You have a new friend request from ${data.payload.user.username}`);
          await updateUser();
          loadFriendRequests();
          break;
        }
    
        case 'friend_request_accepted': {
          // Когда кто-то принял нашу заявку
          const { message, user } = data.payload;
          showAlert(message, 'success');
          console.log('request_accepted from user:', user);
          // Тоже можно сделать await updateUser();
          // Или loadFriends() и т.д.
          break;
        }
    
        case 'friend_request_rejected': {
          const { message, user } = data.payload;
          showAlert(message, 'warning');
          console.log('request_rejected from user:', user);
          // Можно обновить UserState
          break;
        }
    
        case 'friend_blocked': {
          const { message, user } = data.payload;
          showAlert(`${message}. Blocked by ${user.username}`, 'warning');
          console.log(data)
          // ...
          break;
        }
    
        case 'friend_unblocked': {
          const { message, user } = data.payload;
          showAlert(`${message}. Unblocked by ${user.username}`, 'info');
          // ...
          break;
        }
    
        case 'friend_deleted': {
          const { message, user } = data.payload;
          showAlert(`${message}. Deleted by ${user.username}`, 'info');
          // ...
          break;
        }
    
        case 'chat_message': {
          const { fromUserId, toUserId, text } = data.payload;
          console.log(`Chat message from ${fromUserId} to ${toUserId}: ${text}`);
          // Возможно, вызвать какую-то chatStore.addMessage(...)
          break;
        }
    
        case 'system_notification': {
          const { message, severity } = data.payload;
          showAlert(message, 'danger');
          break;
        }
    
        default:
          console.warn('Unknown WS message type:', data);
      }
    };
    return socket;
  }
  
  export function getWebSocket(): WebSocket | null {
    return socket;
  }