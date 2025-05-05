import { displayMessage } from "./chat";
import { ChatState } from "./chatState";
import { UserWebSocketMessage } from "./models/websocket.model";
import { showAlert } from "./services/alert.service";
import { ChatArray } from "./chat";
import { WS_CHAT_URL } from "./outils/config";
import UserState from "./userState";

let socket : WebSocket | null = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 10;
const reconnectDelay = 3000; 

export function connectChatWebSocket(token: string): WebSocket {
    if (socket && socket.readyState === WebSocket.OPEN) {
      return socket;
    } 

    socket = new WebSocket(`${WS_CHAT_URL}?token=${token}`);

    socket.onopen = () => {
      console.log("Chat - WebSocket connection established");
      reconnectAttempts = 0; // Reset the reconnect attempts on successful connection
    };

    socket.onclose = () => {
      console.log("User WS closed");
      socket = null;

      if (reconnectAttempts < maxReconnectAttempts  && UserState.getUser()?.id !== undefined) {
        setTimeout(() => {
          console.log(`Attempting reconnect (#${reconnectAttempts + 1})`);
          reconnectAttempts++;
          const token = localStorage.getItem("token");
          if (token) {
            const newSocket = connectChatWebSocket(token);
            UserState.setChatSocket(newSocket);
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
          const newMessage: ChatArray = {
            id: Date.now(), // Identifiant unique temporaire
            fromUserId: data.payload.fromUserId,
            toUserId: data.payload.toUserId,
            content: data.payload.text,
            sent_at: data.payload.sent_at,
          };
          ChatState.addMessage(newMessage);
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