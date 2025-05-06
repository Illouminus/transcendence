import { loadFriendRequests, loadFriends } from "./friends";
import { fetchAllUsers, updateUser } from "./loaders/outils";
import { UserWebSocketMessage } from "./models/websocket.model";
import { WS_USER_URL } from "./outils/config";
import { showAlert } from "./services/alert.service";
import { fetchUsers } from "./users";
import { UserState } from "./userState";
import { updateChatUserRowStatus }  from "./chat";

let socket : WebSocket | null = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 10;
const reconnectDelay = 3000; 

export let activeConnections: Set<number> = new Set();

export function connectUserWebSocket(token: string): WebSocket {
  
    if (socket && socket.readyState === WebSocket.OPEN) {
      return socket;
    } 
    socket = new WebSocket(`${WS_USER_URL}?token=${token}`);
    socket.onopen = () => {
      console.log("WebSocket connection established");
      reconnectAttempts = 0;
    };
    socket.onclose = () => {
      console.log("User WS closed");
      socket = null;
      activeConnections.clear();
      if (reconnectAttempts < maxReconnectAttempts  && UserState.getUser()?.id !== undefined) {
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
    
      switch (data.type) {
        case 'incoming_request': {
          showAlert(`You have a new friend request from ${data.payload.user.username}`);
          await updateUser();
          UserState.notifyFriendEvent({
            type: 'incoming_request',
            friendId: data.payload.user.id,
            friendEmail: data.payload.user.email
          });
          UserState.notifyConnectionChange();
          break;
        }
        case 'friend_request_accepted': {
          console.log("Friend request accepted: ", data.payload);
          const { message, user, isOnline } = data.payload;
          showAlert(message, 'success');
          await updateUser();
          UserState.updateFriendStatus(user.id, isOnline, user.email);
          UserState.notifyFriendEvent({
            type: 'friend_added',
            friendId: user.id,
            friendEmail: user.email
          });
          UserState.notifyConnectionChange();
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
          UserState.notifyConnectionChange();
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
          
          UserState.notifyFriendEvent({
            type: 'friend_unblocked',
            friendId: user.id,
            friendEmail: user.email,
            isOnline: isOnline
          });
          await updateUser();
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
          UserState.notifyConnectionChange();
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
          updateChatUserRowStatus(user.id, true);
          break;
        }

        case 'user_online': {
          const { user } = data.payload;
          showAlert(`${user.friend_username} is online`, 'info');
          activeConnections.add(user.friend_id);
          UserState.notifyFriendEvent({
            type: 'friend_online',
            friendId: user.friend_id,
            friendEmail: user.friend_email
          });
          updateChatUserRowStatus(user.friend_id, true); 
          break;
        }

        case 'user_disconnected': {
          console.log("User disconnected: ", data.payload);
          const { user } = data.payload;
          activeConnections.delete(user.id);
          showAlert(`${user.username} disconnected`, 'info');
          UserState.notifyFriendEvent({
            type: 'friend_disconnected',
            friendId: user.id,
            friendEmail: user.email
          });
          updateChatUserRowStatus(user.id, false);
          break;
        }

        case 'user_registered': {
          console.log("User registered: ", data.payload);
          const allUsers = await fetchAllUsers();
          console.log("All users: ", allUsers);
          if (allUsers) {
            UserState.setAllUsers(allUsers);
          }
          if(UserState.getCurrentPage() === 'users')
            await fetchUsers();
          break; // 🔥 ВАЖНО!
        }

        // case 'user_updated': {
        //   const { user } = data.payload;
        //   console.log("User updated: ", user);
        //   UserState.updateUser(user);
        //   break;
        // }

        case 'user_avatar_updated': {
          const { userId, avatarUrl } = data.payload;
          UserState.updateUserAvatar(userId, avatarUrl);
          break;
        }

        case 'user_username_updated': {
          const { userId, username } = data.payload;
          console.log("User username updated: ", userId, username);
          UserState.updateUserUsername(userId, username);
          break;
        }

        case 'ping':
          break; // Ignore ping messages
    
        default:
          console.warn('Unknown WS message type:', data);
      }
    };
    return socket;
  }
  
  export function getWebSocket(): WebSocket | null {
    return socket;
  }