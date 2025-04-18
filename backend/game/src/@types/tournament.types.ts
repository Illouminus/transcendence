export type TournamentPhase = 'waiting' | 'semifinals' | 'third_place' | 'final' | 'completed';

export type GameType = 'casual' | 'tournament' | 'ai';

export type MatchType = 'semifinal' | 'final' | 'third_place';

export interface TournamentPlayer {
    id: number;
    username: string;
    avatar: string;
    ready: boolean;
    isHost?: boolean;
    finalPlace?: number;
}

export interface TournamentMatch {
    id: number;
    tournamentId: number;
    player1Id: number;
    player2Id: number;
    gameId?: number;
    winnerId?: number;
    matchType: MatchType;
    startedAt?: Date;
    completedAt?: Date;
}

export interface TournamentState {
    tournamentId: string;
    phase: TournamentPhase;
    hostId: number;
    players: TournamentPlayer[];
    matches?: {
        semifinals?: TournamentMatch[];
        thirdPlace?: TournamentMatch;
        final?: TournamentMatch;
    };
    createdAt: Date;
    completedAt?: Date;
}

export interface TournamentResult {
    tournamentId: string;
    podium: Array<{
        userId: number;
        place: number;
    }>;
}

// WebSocket message types
export type TournamentWebSocketMessage = {
    type: 'create_tournament';
    payload?: undefined;
} | {
    type: 'join_tournament';
    payload: { tournamentId: string };
} | {
    type: 'leave_tournament';
    payload: { tournamentId: string };
} | {
    type: 'toggle_ready';
    payload: { 
        tournamentId: string;
        ready: boolean;
    };
} | {
    type: 'start_ai_game';
    payload: {
        difficulty: 'easy' | 'medium' | 'hard';
    };
} | {
    type: 'game_invite';
    payload: {
        friendId: number;
    };
} | {
    type: 'game_invitation_accepted';
    payload: {
        friendId: number;
    };
} | {
    type: 'game_invitation_rejected';
    payload: {
        friendId: number;
    };
} | {
    type: 'player_move';
    gameId: number;
    userId: number;
    direction: 'LEFT' | 'RIGHT';
} | {
    type: 'game_end';
    payload?: undefined;
} | {
    type: 'game_update';
    payload?: undefined;
} | {
    type: 'game_statistics';
    payload?: undefined;
} | {
    type: 'game_error';
    payload?: undefined;
};

// WebSocket response types
export type TournamentWebSocketResponse = {
    type: 'tournament_created';
    payload: {
        tournamentId: string;
        hostId: number;
    };
} | {
    type: 'tournament_state_update';
    payload: TournamentState;
} | {
    type: 'tournament_match_start';
    payload: {
        matchId: number;
        opponentId: number;
        gameId: number;
        matchType: MatchType;
    };
} | {
    type: 'tournament_match_complete';
    payload: {
        matchId: number;
        matchType: MatchType;
        gameId: number;
        winnerId: number;
        score1: number;
        score2: number;
    };
} | {
    type: 'tournament_completed';
    payload: TournamentResult;
} | {
    type: 'game_created';
    payload: {
        gameId: number;
        gameType: GameType;
    };
} | {
    type: 'game_invitation_income';
    payload: {
        fromUserId: number;
    };
} | {
    type: 'game_invitation_accepted';
    payload: {
        fromUserId: number;
    };
} | {
    type: 'game_invitation_rejected';
    payload: {
        fromUserId: number;
    };
} | {
    type: 'game_end';
    payload: {
        message: string;
    };
} | {
    type: 'game_update';
    payload: {
        message: string;
    };
} | {
    type: 'game_statistics';
    payload: {
        message: string;
    };
} | {
    type: 'game_error';
    payload: {
        message: string;
    };
} | {
    type: 'error';
    payload: {
        message: string;
    };
}; 