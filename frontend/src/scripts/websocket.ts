import { loadFriendRequests, updateUser } from "./friends";
import { showAlert } from "./services/alert.service";
import { fetchUserProfile } from "./services/user.service";
import { UserState } from "./userState";

let socket : WebSocket | null = null;

export type WebSocketMessage =
  | {
      type: 'incoming_request';
      payload: FriendRequestPayload;
    }
  | {
      type: 'request_accepted';
      payload: FriendRequestAcceptedPayload;
    }
  | {
      type: 'chat_message';
      payload: ChatMessagePayload;
    }
  | {
      type: 'system_notification';
      payload: SystemNotificationPayload;
    }
  ;


interface FriendRequestPayload {
  message: string;
  user: {
    id: number;
    username: string;
    email: string;
    avatar: string;
  };
}

interface FriendRequestAcceptedPayload {
  friendId: number; // id друга, который принял заявку
  // можно добавить имя друга, аватар, и т.д.
}

interface ChatMessagePayload {
  fromUserId: number;
  toUserId: number;
  text: string;
  // можно добавить timestamp, id сообщения и т.д.
}

interface SystemNotificationPayload {
  message: string;
  severity: 'info' | 'warning' | 'error';
}

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
      
      switch (data.type) {
        case 'incoming_request':
          showAlert(`You have a new friend request from ${data.payload.user.username}`);
          await updateUser();
          loadFriendRequests();
          console.log('incoming_request', data.payload);
          break;
        case 'request_accepted':
          console.log('request_accepted', data.payload);
          break;
        case 'chat_message':
          console.log('chat_message', data.payload);
          break;
        case 'system_notification':
          console.log('system_notification', data.payload);
          break;
      }
      
    };
    return socket;
  }
  
  export function getWebSocket(): WebSocket | null {
    return socket;
  }