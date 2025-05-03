export type TournamentPhase = 'waiting' | 'semifinals' | 'third_place' | 'final' | 'completed';

export type GameType = 'casual' | 'tournament' | 'ai';

export type MatchType = 'semifinal' | 'final' | 'third_place';



export interface DbTournament {
    id: number;
    status: string;
    host_id: number;
    created_at: string;
    completed_at: string | null;
}
export interface TournamentPlayer {
    id: number;
    ready: boolean;
    alias: string;
  }

  export interface DbTournamentMatch {
    id: number;
    tournament_id: number;
    player1_id: number;
    player2_id: number;
    game_id: number | null;
    winner_id: number | null;
    match_type: MatchType;
    started_at: string | null;
    completed_at: string | null;
  }

  export interface TournamentMatch {
    id: number;
    player1Id: number;
    player2Id: number;
    matchType: MatchType;
    gameId?: number | null;
    winnerId?: number | null;
    startedAt?: string;
    completedAt?: string;
  }

  export interface TournamentState {
    tournamentId: number;
    phase: TournamentPhase;
    players: TournamentPlayer[];
    matches?: {
      semifinals: TournamentMatch[];
      final?: TournamentMatch;
    };
  }

export interface TournamentResult {
    tournamentId: string;
    podium: Array<{
        userId: number;
        place: number;
    }>;
}
