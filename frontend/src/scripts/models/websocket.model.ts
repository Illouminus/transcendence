import { TournamentMatch } from "../types/tournament.types";

export type UserWebSocketMessage =
  | { type: 'incoming_request'; payload: IncomingRequestPayload }
  | { type: 'friend_request_accepted'; payload: FriendRequestAcceptedPayload }
  | { type: 'friend_request_rejected'; payload: FriendRequestRejectedPayload }
  | { type: 'friend_blocked'; payload: FriendBlockedPayload }
  | { type: 'friend_unblocked'; payload: FriendUnblockedPayload }
  | { type: 'unblocked_user'; payload: UnblockedUserPayload }
  | { type: 'friend_deleted'; payload: FriendDeletedPayload }
  | { type: 'chat_send'; payload: ChatMessagePayload }
  | { type: 'chat_receive'; payload: ChatMessagePayload }
  | { type: 'chat_user_blocked'; payload: ChatBlockedPayload }
  | { type: 'system_notification'; payload: SystemNotificationPayload }
  | { type: 'user_connected'; payload: {user : UserInfo} }
  | { type: 'user_disconnected'; payload: {user: UserInfo} }
  | { type: 'user_online'; payload: {user: FriendOnline} } 
  | { type: 'tournament_match_start'; payload: TournamentMatchStartPayload }
  | { type: 'tournament_completed'; payload: TournamentCompletedPayload }
  | { type: 'user_registered'; payload: UserRegisteredPayload }
  | { type: 'user_avatar_updated'; payload: UserAvatrUpdatedPayload }
  | { type: 'user_username_updated'; payload: UserUserNameUpdatedPayload }
  | { type: 'ping'}

  export interface IncomingRequestPayload {
    message: string;
    user: UserInfo; // user, который нас добавил
  }
  
  /** Заявка принята */
  export interface FriendRequestAcceptedPayload {
    message: string;
    user: UserInfo; // user, который принял заявку
    isOnline: boolean; // true, если пользователь онлайн
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

  export interface UserAvatrUpdatedPayload {
    userId: number;
    avatarUrl: string;
  }

  export interface UserUserNameUpdatedPayload {
    userId: number;
    username: string;
  }
  
  /** Сообщение чата */
  export interface ChatMessagePayload {
    username: string;
    fromUserId: number;
    toUserId: number;
    text: string;
    sent_at: string; 
  }

  export interface ChatBlockedPayload {
    message: string;
    user: UserInfo;
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
    alias?: string;
  }
  

export type GameWebSocketMessage = 
| { type: 'game_invitation_income'; payload: GameInvitationIncomePayload }
| { type: 'game_invitation_accepted'; payload: GameInvitationAcceptedPayload }
| { type: 'game_invitation_rejected'; payload: GameInvitationRejectedPayload }
| { type: 'game_started'; payload: GameStartedPayload }
| { type: 'game_error'; payload: GameErrorPayload }
| { type: 'game_created'; isAiGame?: boolean,  payload: { gameId: number, isPlayer1: boolean; } }
| { type: 'game_update'; payload: GameUpdatePayload }
| { type: 'game_countdown'; payload: GameCountdownPayload }
| { type: 'game_result'; game_type: string, payload: GameResultPayload }
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
    matchType: 'semifinal' | 'final';
    gameId: string;
    winnerId: number;
    score1: number;
    score2: number;
  }}
| { type: 'tournament_completed'; payload: TournamentCompletedPayload }
| { type: 'tournament_player_left'; payload: { userId: number; tournamentId: number } }
| { type: 'tournament_deleted'; payload: { tournamentId: number } }
| { type: 'ping' }

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


export interface UserRegisteredPayload {
  userId: number;
  username: string;
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
  opponentAlias: string;
  gameId: number;
  round: number; // 1 = полуфинал, 2 = финал
  matchType: 'semifinal' | 'final' | 'third_place';
  isPlayer1: boolean;
  matches: {
    semifinals?: TournamentMatch[];
    final?: TournamentMatch;
  }
}

export interface TournamentCompletedPayload {
  podium: Array<{
    userId: number;
    place: number; // 1, 2, 3
  }>;
}

export interface TournamentCreatedPayload {
  tournamentId: number;
  hostId: number;
}

export interface TournamentStatePayload {
  tournamentId: number;
  phase: 'waiting' | 'semifinals' | 'final' | 'completed';
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