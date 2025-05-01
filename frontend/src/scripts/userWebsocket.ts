import { loadFriendRequests, loadFriends } from "./friends";
import { fetchAllUsers, updateUser } from "./loaders/outils";
import { UserWebSocketMessage } from "./models/websocket.model";
import { WS_BASE } from "./outils/config";
import { showAlert } from "./services/alert.service";
import { fetchUsers } from "./users";
import { UserState } from "./userState";

let socket : WebSocket | null = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 10;
const reconnectDelay = 3000; 

let activeConnections: Set<number> = new Set();

export function connectUserWebSocket(token: string): WebSocket {
  
    if (socket && socket.readyState === WebSocket.OPEN) {
      return socket;
    } 
    socket = new WebSocket(`${WS_BASE}/user?token=${token}`);
    socket.onopen = () => {
      console.log("WebSocket connection established");
      reconnectAttempts = 0;
    };
    socket.onclose = () => {
      console.log("User WS closed");
      socket = null;
      activeConnections.clear();
      if (reconnectAttempts < maxReconnectAttempts) {
        setTimeout(() => {
          console.log(`Attempting reconnect (#${reconnectAttempts + 1})`);
          reconnectAttempts++;
          const token = localStorage.getItem("token");
          if (token) {
            const newSocket = connectUserWebSocket(token);
            UserState.setUserSocket(newSocket);
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
    
      console.log('WebSocket message:', data);
      switch (data.type) {
        case 'incoming_request': {
          showAlert(`You have a new friend request from ${data.payload.user.username}`);
          await updateUser();
          UserState.notifyFriendEvent({
            type: 'incoming_request',
            friendId: data.payload.user.id,
            friendEmail: data.payload.user.email
          });
          break;
        }
        case 'friend_request_accepted': {
          const { message, user } = data.payload;
          showAlert(message, 'success');
          await updateUser();
          UserState.notifyFriendEvent({
            type: 'friend_added',
            friendId: user.id,
            friendEmail: user.email
          });
          fetchUsers();
          break;
        }
    
        case 'friend_request_rejected': {
          const { message, user } = data.payload;
          showAlert(message, 'warning');
          await updateUser();
          UserState.notifyFriendEvent({
            type: 'friend_request_rejected',
            friendId: user.id,
            friendEmail: user.email
          });
          const allUsers = await fetchAllUsers();
          if(allUsers)
            UserState.setAllUsers(allUsers);
          fetchUsers();
          break;
        }
    
        case 'friend_blocked': {
          const { message, user } = data.payload;
          showAlert(`${message}. Blocked by ${user.username}`, 'warning');
          await updateUser();
          UserState.notifyFriendEvent({
            type: 'friend_blocked',
            friendId: user.id,
            friendEmail: user.email
          });
          break;
        }
    
        case 'friend_unblocked': {
          const { message, user, isOnline } = data.payload;
          showAlert(`${message}. Unblocked by ${user.username}`, 'info');
          
          // Сначала отправляем событие об изменении статуса
          UserState.notifyFriendEvent({
            type: 'friend_unblocked',
            friendId: user.id,
            friendEmail: user.email,
            isOnline: isOnline
          });
          
          // Затем обновляем данные пользователя
          await updateUser();
          
          // И восстанавливаем статус онлайн
          UserState.updateFriendStatus(user.id, isOnline, user.email);
          break;
        }

        case 'unblocked_user': {
          const { message, user, isOnline } = data.payload;
          showAlert(message, 'info');
          console.log("User Id and is online ", user.id, isOnline);
          
          // Сначала отправляем событие об изменении статуса
          UserState.notifyFriendEvent({
            type: 'user_unblocked',
            friendId: user.id,
            friendEmail: user.email,
            isOnline: isOnline
          });
          
          // Затем обновляем данные пользователя
          await updateUser();
          
          console.log("User State: ", UserState.getUser());
          // И восстанавливаем статус онлайн
          UserState.updateFriendStatus(user.id, isOnline, user.email);
          break;
        }
    
        case 'friend_deleted': {
          const { message, user } = data.payload;
          showAlert(`${message}. Deleted by ${user.username}`, 'info');
          await updateUser();
          UserState.notifyFriendEvent({
            type: 'friend_deleted',
            friendId: user.id,
            friendEmail: user.email
          });
          break;
        }
        case 'system_notification': {
          const { message, severity } = data.payload;
          showAlert(message, 'danger');
          break;
        }

        case 'user_connected': {
          const { user } = data.payload;
          activeConnections.add(user.id);
          if(UserState.getUser()?.id === user.id){
            return;
          }
          showAlert(`${user.username} connected`, 'info');
          UserState.notifyFriendEvent({
            type: 'friend_connected',
            friendId: user.id,
            friendEmail: user.email
          });
          break;
        }

        case 'user_online': {
          const { user } = data.payload;
          showAlert(`${user.friend_username} is online`, 'info');
          UserState.notifyFriendEvent({
            type: 'friend_online',
            friendId: user.friend_id,
            friendEmail: user.friend_email
          });
          break;
        }

        case 'user_disconnected': {
          const { user } = data.payload;
          activeConnections.delete(user.id);
          showAlert(`${user.username} disconnected`, 'info');
          UserState.notifyFriendEvent({
            type: 'friend_disconnected',
            friendId: user.id,
            friendEmail: user.email
          });
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