import db from '../database';
import { sendNotification } from '../server';
import { createAndStartGame } from './game.service';
import { GameType } from '../@types/tournament.types';
import { createTournamentDB, getExistingPlayersDB, getTournamentDB, insertUserTournamentDB, updateReadyDB } from '../models/tournament.model';


interface DbTournamentMatch {
    id: number;
    tournament_id: number;
    player1_id: number;
    player2_id: number;
    game_id: number | null;
    winner_id: number | null;
    match_type: 'semifinal' | 'final';
    started_at: string | null;
    completed_at: string | null;
}

interface TournamentPlayer {
    id: number;
    ready: boolean;
}

interface TournamentMatch {
    id: number;
    player1Id: number;
    player2Id: number;
    matchType: 'semifinal' | 'final';
    gameId?: number;
    startedAt?: string;
    completedAt?: string;
}

interface TournamentState {
    tournamentId: number;
    phase: 'waiting' | 'semifinals' | 'final';
    players: TournamentPlayer[];
    matches?: {
        semifinals: TournamentMatch[];
        final?: TournamentMatch;
    };
}

// Active tournaments cache
const activeTournaments: Record<number, TournamentState> = {};

export async function createTournament(hostId: number): Promise<number> {
	const result = await createTournamentDB(hostId);
    if (!result) {
        throw new Error('Failed to create tournament');
    }

    await insertUserTournamentDB(result, hostId);
    
    const state: TournamentState = {
        tournamentId: result,
        phase: 'waiting',
        players: [{
            id: hostId,
            ready: false
        }]
    };
    
    activeTournaments[result] = state;
    return result;
}

export async function joinTournament(tournamentId: number, userId: number): Promise<void> {

    try {
        const tournament = await getTournamentDB(tournamentId);
        if (!tournament || tournament.status !== 'waiting') {
            throw new Error('Tournament not available for joining');
        }
        const existingPlayer = await getExistingPlayersDB(tournamentId);
        console.log('EXISTING PLAYERS', existingPlayer);
        if (existingPlayer) {
            throw new Error('User already in tournament');
        } 
        const state = activeTournaments[tournamentId];
        if (state) {
            state.players.push({
                id: userId,
                ready: false
            });
            broadcastTournamentState(tournamentId);
        }
        
    } catch (error) {
        console.error('Error joining tournament:', error);
        throw error;
    }

}



export async function toggleReady(tournamentId: number, userId: number, ready: boolean): Promise<void> {
    await updateReadyDB(tournamentId, userId, ready);
    const state = activeTournaments[tournamentId];
    if (state) {
        const player = state.players.find(p => p.id === userId);
        if (player) {
            player.ready = ready;
        }

        if (state.players.length === 4 && state.players.every(p => p.ready)) {
            await startTournament(tournamentId);
        } else {
            broadcastTournamentState(tournamentId);
        }
    }
}

async function startTournament(tournamentId: number): Promise<void> {
    const tournament = activeTournaments[tournamentId];
    if (!tournament) return;

    // Create semifinal matches
    const players = tournament.players;
    const matches = [
        {
            id: 1,
            player1Id: players[0].id,
            player2Id: players[1].id,
            matchType: 'semifinal' as const
        },
        {
            id: 2,
            player1Id: players[2].id,
            player2Id: players[3].id,
            matchType: 'semifinal' as const
        }
    ];

    // Insert matches into database
    for (const match of matches) {
        await db.run(`
            INSERT INTO tournament_matches (tournament_id, player1_id, player2_id, match_type)
            VALUES (?, ?, ?, ?)
        `, [tournamentId, match.player1Id, match.player2Id, match.matchType]);
    }

    tournament.phase = 'semifinals';
    tournament.matches = {
        semifinals: matches
    };

    // Start semifinal games
    for (const match of matches) {
        const gameId = await createAndStartGame({
            player_1_id: match.player1Id,
            player_2_id: match.player2Id,
            tournament_id: tournamentId.toString(),
            match_id: match.id
        });

        // Update match with game_id
        await db.run(`
            UPDATE tournament_matches
            SET game_id = ?, started_at = CURRENT_TIMESTAMP
            WHERE tournament_id = ? AND player1_id = ? AND player2_id = ?
        `, [gameId, tournamentId, match.player1Id, match.player2Id]);
    }

    // Notify players about their matches
    for (const match of matches) {
        sendNotification(match.player1Id, {
            type: 'tournament_match_ready',
            payload: { matchId: match.id }
        });
        sendNotification(match.player2Id, {
            type: 'tournament_match_ready',
            payload: { matchId: match.id }
        });
    }

    broadcastTournamentState(tournamentId);
}

function broadcastTournamentState(tournamentId: number): void {
    const state = activeTournaments[tournamentId];
    if (!state) return;
    
    const payload = {
        type: 'tournament_state_update',
        payload: state
    };
    
    for (const player of state.players) {
        sendNotification(player.id, payload);
    }
}

export async function handleGameComplete(gameId: number, winnerId: number): Promise<void> {
    const game = (await db.get(`
        SELECT tournament_id, match_id, game_type 
        FROM games 
        WHERE id = ?
    `, [gameId])) as unknown as { tournament_id: number; match_id: number; game_type: GameType } | undefined;

    if (!game || !game.tournament_id) return;

    const match = (await db.get(`
        SELECT id, tournament_id, player1_id, player2_id, game_id, winner_id, match_type, started_at, completed_at 
        FROM tournament_matches 
        WHERE id = ?
    `, [game.match_id])) as unknown as DbTournamentMatch | undefined;

    if (!match) return;

    // Update match winner and completion time
    await db.run(
        'UPDATE tournament_matches SET winner_id = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?',
        [winnerId, game.match_id]
    );

    // If this was a semifinal match, create final match
    if (match.match_type === 'semifinal') {
        // Get all semifinal matches to determine finalists
        const semifinals = (await db.all(`
            SELECT id, winner_id 
            FROM tournament_matches 
            WHERE tournament_id = ? AND match_type = ?
        `, [game.tournament_id, 'semifinal'])) as unknown as Array<{ id: number; winner_id: number | null }>;

        // If both semifinals are completed, create final match
        if (semifinals.length === 2 && semifinals.every(m => m.winner_id)) {
            await db.run(`
                INSERT INTO tournament_matches (tournament_id, player1_id, player2_id, match_type)
                VALUES (?, ?, ?, ?)
            `, [game.tournament_id, semifinals[0].winner_id, semifinals[1].winner_id, 'final']);
        }
    }

    // If this was the final match, update tournament status and winner
    if (match.match_type === 'final') {
        await db.run(
            'UPDATE tournaments SET status = ?, winner_id = ? WHERE id = ?',
            'completed', winnerId, game.tournament_id
        );

        // Notify all tournament players
        const players = (await db.all(`
            SELECT user_id 
            FROM tournament_players 
            WHERE tournament_id = ?
        `, [game.tournament_id])) as unknown as Array<{ user_id: number }>;

        for (const player of players) {
            sendNotification(player.user_id, {
                type: 'tournament_completed',
                payload: {
                    tournament_id: game.tournament_id.toString(),
                    winner_id: winnerId
                }
            });
        }
    }
} 