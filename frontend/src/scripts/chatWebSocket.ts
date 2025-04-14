import { chat } from "./chat";
import { UserWebSocketMessage } from "./models/websocket.model";
import { showAlert } from "./services/alert.service";

let socket : WebSocket | null = null;


export function connectChatWebSocket(token: string): WebSocket {
    if (socket && socket.readyState === WebSocket.OPEN) {
      return socket;
    } 
    socket = new WebSocket(`ws://localhost:8084/ws?token=${token}`);
    socket.onopen = () => {
      console.log("WebSocket connection established");
    };
    // socket.onclose = () => {
    //   console.log("WebSocket connection closed");
    //   socket = null;
    // };
    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
    };
    socket.onmessage = async (event) => {
      const data: UserWebSocketMessage = JSON.parse(event.data);
    
      console.log('WebSocket message:', data);
      switch (data.type) {        
        case 'chat_message': {
          const { fromUserId, toUserId, text } = data.payload;
          console.log(`Chat message from ${fromUserId} to ${toUserId}: ${text}`);
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