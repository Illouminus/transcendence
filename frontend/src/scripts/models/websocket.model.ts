export type UserWebSocketMessage =
  | { type: 'incoming_request'; payload: IncomingRequestPayload }
  | { type: 'friend_request_accepted'; payload: FriendRequestAcceptedPayload }
  | { type: 'friend_request_rejected'; payload: FriendRequestRejectedPayload }
  | { type: 'friend_blocked'; payload: FriendBlockedPayload }
  | { type: 'friend_unblocked'; payload: FriendUnblockedPayload }
  | { type: 'friend_deleted'; payload: FriendDeletedPayload }
  | { type: 'chat_message'; payload: ChatMessagePayload }
  | { type: 'system_notification'; payload: SystemNotificationPayload }
  | { type: 'user_connected'; payload: {user : UserInfo} }
  | { type: 'user_disconnected'; payload: {user: UserInfo} }
  | { type: 'user_online'; payload: {user: FriendOnline} };

  export interface IncomingRequestPayload {
    message: string;
    user: UserInfo; // user, который нас добавил
  }
  
  /** Заявка принята */
  export interface FriendRequestAcceptedPayload {
    message: string;
    user: UserInfo; // user, который принял заявку
  }
  
  /** Заявка отклонена */
  export interface FriendRequestRejectedPayload {
    message: string;
    user: UserInfo; // user, который отклонил
  }
  
  /** Нас заблокировали */
  export interface FriendBlockedPayload {
    message: string;
    user: UserInfo; // user, который нас заблокировал
  }
  
  /** Нас разблокировали */
  export interface FriendUnblockedPayload {
    message: string;
    user: UserInfo; // user, который нас разблокировал
  }
  
  /** Нас удалили из друзей */
  export interface FriendDeletedPayload {
    message: string;
    user: UserInfo; // user, который нас удалил
  }
  
  /** Сообщение чата */
  export interface ChatMessagePayload {
    fromUserId: number;
    toUserId: number;
    text: string;
    // можно добавить timestamp, id сообщения и т.д.
  }
  
  /** Системное уведомление */
  export interface SystemNotificationPayload {
    message: string;
    severity: 'info' | 'warning' | 'error';
  }
  
  /** Общая структура информации о пользователе */
  export interface UserInfo {
    id: number;
    username: string;
    email: string;
    avatar: string;
    auth_user_id: number;

    // ...другие поля при желании
  }
  
  export interface FriendOnline { 
    friend_avatar: string;
    friend_email: string;
    friend_id: number;
    friend_username: string;
    status: string;
  }


export type GameWebSocketMessage = 
| { type: 'game_invitation_income'; payload: GameInvitationIncomePayload }
| { type: 'game_invitation_accepted'; payload: GameInvitationAcceptedPayload }
| { type: 'game_invitation_rejected'; payload: GameInvitationRejectedPayload }
| { type: 'game_started'; payload: GameStartedPayload }
| { type: 'game_error'; payload: GameErrorPayload }
| { type: 'game_update'; payload: GameUpdatePayload }
| { type: 'game_result'; payload: GameResultPayload } ;


export interface GameInvitationIncomePayload {
  fromUserId: number;
  gameType: string;
  message?: string;
}
export interface GameInvitationAcceptedPayload {
  fromUserId: number;
  gameType: string;
  message: string;
}

export interface GameInvitationRejectedPayload {
  fromUserId: number;
  gameType: string;
  message: string;
}
export interface GameStartedPayload {
  gameId: number;
  gameType: string;
  players: Array<{ userId: number; username: string; }>;
  // другие поля, которые могут понадобиться
}
export interface GameErrorPayload {
  errorCode: string;
  errorMessage: string; 
  gameId: number;
  gameType: string;
  // другие поля, которые могут понадобиться
}

export interface GameUpdatePayload {
  gameId: number;
  gameType: string;
  updateData: any; // данные обновления, могут быть разные в зависимости от игры
}

export interface GameResultPayload {
  gameId: number;
  gameType: string;
  winnerId: number; // ID победителя
  // другие поля, которые могут понадобиться
}