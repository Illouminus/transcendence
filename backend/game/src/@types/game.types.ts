import { GameType } from './tournament.types';

export interface PlayerState {
    userId: number;
    x: number;
    y: number;
    score: number;
}

export interface DbGame {
    id: number;
    tournament_id: number;
    match_id: number;
    game_type: 'casual' | 'tournament' | 'ai';
  }

export interface BallState {
    x: number;
    y: number;
    velX: number;
    velY: number;
    recentCollision: boolean;
}

export interface GameState {
    gameId: number;
    player1: PlayerState;
    player2: PlayerState;
    ball: BallState;
    isRunning: boolean;
    gameType: GameType;
    tournamentMatchId?: number;
    aiDifficulty?: 'easy' | 'medium' | 'hard';
}

export interface GameResult {
    gameId: number;
    winnerId: number;
    score1: number;
    score2: number;
    gameType: GameType;
    tournamentMatchId?: number;
}

export interface GameStatistics {
    totalGamesPlayed: number;
    totalTournamentsPlayed: number;
    totalTournamentsWins: number;
}

export interface GameError {
    message: string;
    code?: string;
}

export function initGameState(gameId: number, player1Id: number, player2Id: number): GameState {
    return {
        gameId,
        gameType: 'casual',
        player1: {
            userId: player1Id,
            x: 0,
            y: -12,
            score: 0
        },
        player2: {
            userId: player2Id,
            x: 0,
            y: 12,
            score: 0
        },
        ball: {
            x: 0,
            y: 0,
            velX: (Math.random() - 0.5) * 0.2,
            velY: 0.2,
            recentCollision: false
        },
        isRunning: false
    };
}

// Запускаем цикл игры, сохраняя идентификатор setInterval, чтобы потом можно было остановить
