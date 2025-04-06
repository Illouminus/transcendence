import { loadFriendRequests, loadFriends } from "./friends";
import { fetchAllUsers, updateUser } from "./loaders/outils";
import { UserWebSocketMessage } from "./models/websocket.model";
import { showAlert } from "./services/alert.service";
import { fetchUsers } from "./users";
import { UserState } from "./userState";

let socket : WebSocket | null = null;



export function connectUserWebSocket(token: string): WebSocket {
  
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
      const data: UserWebSocketMessage = JSON.parse(event.data);
    
      console.log('WebSocket message:', data);
      switch (data.type) {
        case 'incoming_request': {
          showAlert(`You have a new friend request from ${data.payload.user.username}`);
          await updateUser();
          loadFriendRequests();
          break;
        }
    
        case 'friend_request_accepted': {
          const { message, user } = data.payload;
          showAlert(message, 'success');
          await updateUser();
          UserState.updateFriendStatus(user.id, true, user.email);
          fetchUsers();
          loadFriends();
          break;
        }
    
        case 'friend_request_rejected': {
          const { message, user } = data.payload;
          showAlert(message, 'warning');
          await updateUser();
          const allUsers = await fetchAllUsers();
          if(allUsers)
            UserState.setAllUsers(allUsers);
          UserState.removeSentFriendRequest(user.id);
          fetchUsers();
          break;
        }
    
        case 'friend_blocked': {
          const { message, user } = data.payload;
          showAlert(`${message}. Blocked by ${user.username}`, 'warning');
          await updateUser();
          loadFriends();
          break;
        }
    
        case 'friend_unblocked': {
          const { message, user } = data.payload;
          showAlert(`${message}. Unblocked by ${user.username}`, 'info');
          await updateUser();
          UserState.updateFriendStatus(user.id, true, user.email);
          loadFriends();
          break;
        }
    
        case 'friend_deleted': {
          const { message, user } = data.payload;
          showAlert(`${message}. Deleted by ${user.username}`, 'info');
          await updateUser();
          UserState.updateFriendStatus(user.id, false, user.email);
          loadFriends();
          fetchUsers();
          break;
        }
    
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

        case 'user_connected': {
          const { user } = data.payload;

          if(UserState.getUser()?.id === user.id){
            return;
          }
          showAlert(`${user.username} connected`, 'info');
          UserState.updateFriendStatus(user.id, true, user.email);
          loadFriends();
          break;
      }

        case 'user_online': {
          const { user } = data.payload;
          showAlert(`${user.friend_username} is online`, 'info');
          UserState.updateFriendStatus(user.friend_id, true, user.friend_email);
          loadFriends();
          break;
      }

        case 'user_disconnected': {
          const { user } = data.payload;
          showAlert(`${user.username} disconnected`, 'info');
          UserState.updateFriendStatus(user.id, false, user.email);
          loadFriends();
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