export type UserWebSocketMessage =
  | { type: 'incoming_request'; payload: IncomingRequestPayload }
  | { type: 'friend_request_accepted'; payload: FriendRequestAcceptedPayload }
  | { type: 'friend_request_rejected'; payload: FriendRequestRejectedPayload }
  | { type: 'friend_blocked'; payload: FriendBlockedPayload }
  | { type: 'friend_unblocked'; payload: FriendUnblockedPayload }
  | { type: 'unblocked_user'; payload: UnblockedUserPayload }
  | { type: 'friend_deleted'; payload: FriendDeletedPayload }
  | { type: 'chat_message'; payload: ChatMessagePayload }
  | { type: 'system_notification'; payload: SystemNotificationPayload }
  | { type: 'user_connected'; payload: {user : UserInfo} }
  | { type: 'user_disconnected'; payload: {user: UserInfo} }
  | { type: 'user_online'; payload: {user: FriendOnline} 
  | { type: 'tournament_match_start'; payload: TournamentMatchStartPayload }
  | { type: 'tournament_completed'; payload: TournamentCompletedPayload }};

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
    user: UserInfo;
    isOnline: boolean;
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

  /** Пользователь разблокировал кого-то */
  export interface UnblockedUserPayload {
    message: string;
    user: UserInfo; // user, которого разблокировали
    isOnline: boolean;
  }

  export interface TournamentPlayer {
    id: number;
    username: string;
    avatar: string;
    ready: boolean;
    isHost?: boolean;
  }
  

export type GameWebSocketMessage = 
| { type: 'game_invitation_income'; payload: GameInvitationIncomePayload }
| { type: 'game_invitation_accepted'; payload: GameInvitationAcceptedPayload }
| { type: 'game_invitation_rejected'; payload: GameInvitationRejectedPayload }
| { type: 'game_started'; payload: GameStartedPayload }
| { type: 'game_error'; payload: GameErrorPayload }
| { type: 'game_update'; payload: GameUpdatePayload }
| { type: 'game_countdown'; payload: GameCountdownPayload }
| { type: 'game_result'; payload: GameResultPayload }
| { type: 'player_joined'; payload: TournamentPlayer }
| { type: 'player_left'; payload: number } // ID игрока
| { type: 'player_ready'; payload: { playerId: number; ready: boolean } }
| { type: 'tournament_starting'; payload: { startTime: number } }
| { type: 'tournament_started'; payload: void }
| { type: 'tournament_cancelled'; payload: void }
| { type: 'tournament_created'; payload: TournamentCreatedPayload }
| { type : 'new_tournament_created'; payload: TournamentCreatedPayload }
| { type: 'tournament_state_update'; payload: TournamentStatePayload }
| { type: 'tournament_match_start'; payload: TournamentMatchStartPayload }
| { type: 'tournament_match_complete'; payload: { 
    matchType: 'semifinal' | 'third_place' | 'final';
    gameId: string;
    winnerId: number;
    score1: number;
    score2: number;
  }}
| { type: 'tournament_completed'; payload: TournamentCompletedPayload };


export interface GameInvitationIncomePayload {
  fromUserId: number;
  gameType: string;
  message?: string;
}
export interface GameInvitationAcceptedPayload {
  fromUserId: number;
  gameType: string;
  message: string;
  gameId: number;
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
    players: {
      p1: { id: number; x: number; y: number; score: number };
      p2: { id: number; x: number; y: number; score: number };
    };
    ball: {
      x: number;
      y: number;
    };
}

export interface GameResultPayload {
  winnerId: number;
  score1: number;
  score2: number;
}

export interface GameCountdownPayload {
  count: number;
}

export interface TournamentMatchStartPayload {
  opponentId: number;
  gameId: number;
  round: number; // 1 = полуфинал, 2 = финал
  matchType: 'semifinal' | 'final' | 'third_place';
}

export interface TournamentCompletedPayload {
  podium: Array<{
    userId: number;
    place: number; // 1, 2, 3
  }>;
}

export interface TournamentCreatedPayload {
  tournamentId: string;
  hostId: number;
}

export interface TournamentStatePayload {
  tournamentId: string;
  phase: 'waiting' | 'semifinals' | 'third_place' | 'final' | 'completed';
  players: TournamentPlayer[];
  matches?: {
    semifinals?: Array<{
      player1Id: number;
      player2Id: number;
      gameId?: string;
      winner?: number;
    }>;
    thirdPlace?: {
      player1Id: number;
      player2Id: number;
      gameId?: string;
      winner?: number;
    };
    final?: {
      player1Id: number;
      player2Id: number;
      gameId?: string;
      winner?: number;
    };
  };
}