// Это что приходит с сервера
export interface TournamentState {
    tournamentId: number | null;
    phase: 'waiting' | 'semifinals' | 'final' | 'completed';
    players: TournamentPlayer[]; // минимальная инфа
    matches?: {
        semifinals?: TournamentMatch[];
        final?: TournamentMatch;
    };
}

export interface TournamentPlayer {
    id: number;
    ready: boolean;
}

// Отдельный тип матча
export interface TournamentMatch {
    id: number;
    player1Id: number;
    player2Id: number;
    gameId?: string;
    winner?: number;
    matchType: 'semifinal' | 'final'; // тип матча
}

// А это уже для отрисовки красивой мочалки
export interface DisplayPlayer {
    id: number;
    username: string;
    avatar: string;
    status: 'playing' | 'winner' | 'loser' | 'waiting';
}

export interface MatchPair {
    player1: DisplayPlayer;
    player2: DisplayPlayer;
    score1?: number;
    score2?: number;
    winner?: number;
}