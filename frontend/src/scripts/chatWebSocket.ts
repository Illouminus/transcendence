import { displayMessage } from "./chat";
import { UserWebSocketMessage } from "./models/websocket.model";
import { showAlert } from "./services/alert.service";

let socket : WebSocket | null = null;

export function connectChatWebSocket(token: string): WebSocket {
    if (socket && socket.readyState === WebSocket.OPEN) {
      return socket;
    } 

    socket = new WebSocket(`ws://localhost:8084/ws?token=${token}`);

    socket.onopen = () => {
      console.log("Chat - WebSocket connection established");
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed");
      socket = null;
    };

    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    socket.onmessage = async (event) => {
      const data: UserWebSocketMessage = JSON.parse(event.data);
    
      console.log('Chat - Websocket message received:', data);
      switch (data.type) {
        case 'chat_send': {
          console.log('Message sent:', data.payload);
          showAlert(`You sent a message to ${data.payload.username}`, 'success');
          break;
        }
        case 'chat_user_blocked': {
          console.log('User Blocked:', data.payload);
          showAlert(`Cannot send message to ${data.payload.user.username} because is blocked`, 'warning');
          break;
        }
        case 'chat_receive': {
          console.log('Message received:', data.payload);
          showAlert(`New Message from ${data.payload.username}`, 'success');
          displayMessage(data.payload.username, data.payload.username, data.payload.fromUserId,data.payload.text, data.payload.sent_at);
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