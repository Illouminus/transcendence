import { sendNotification } from '../server';
import { createAndStartGame } from './game.service';
import {
  completeMatchDB,
  createTournamentDB,
  getExistingPlayersDB,
  getGameById,
  getMatchById,
  getSemifinalWinners,
  getTournamentDB,
  getTournamentPlayers,
  insertFinalMatchDB,
  insertMatchDB,
  insertUserTournamentDB,
  setTournamentWinner,
  updateMatchWithGameDB,
  updateReadyDB
} from '../models/tournament.model';
import { activeTournaments } from '../state/tournament.state';
import { DbTournamentMatch, TournamentMatch, TournamentPlayer, TournamentState } from '../@types/tournament.types';

function toTournamentMatch(row: DbTournamentMatch): TournamentMatch {
  return {
    id: row.id,
    player1Id: row.player1_id,
    player2Id: row.player2_id,
    matchType: row.match_type,
    gameId: row.game_id,
    winnerId: row.winner_id,
    startedAt: row.started_at || undefined,
    completedAt: row.completed_at || undefined,
  };
}

function broadcastTournamentState(tournamentId: number): void {
  const state = activeTournaments[tournamentId];
  if (!state) return;

  const payload = {
    type: 'tournament_state_update',
    tournamentId,
    payload: state
  };

  for (const player of state.players) {
    sendNotification(player.id, payload);
  }
}

export async function createTournament(hostId: number): Promise<number> {
  const tournamentId = await createTournamentDB(hostId);
  await insertUserTournamentDB(tournamentId, hostId);

  activeTournaments[tournamentId] = {
    tournamentId,
    phase: 'waiting',
    players: [{ id: hostId, ready: false }]
  };

  return tournamentId;
}

export async function joinTournament(tournamentId: number, userId: number): Promise<void> {
  const tournament = await getTournamentDB(tournamentId);
  if (!tournament || tournament.status !== 'waiting') {
    throw new Error('Tournament not available for joining');
  }

  const players = await getExistingPlayersDB(tournamentId);
  if (players.includes(userId)) {
    throw new Error('User already joined');
  }

  const state = activeTournaments[tournamentId];
  if (state) {
    state.players.push({ id: userId, ready: false });
    broadcastTournamentState(tournamentId);
  }
}

export async function toggleReady(tournamentId: number, userId: number, ready: boolean): Promise<void> {
  await updateReadyDB(tournamentId, userId, ready);
  const state = activeTournaments[tournamentId];
  if (state) {
    const player = state.players.find(p => p.id === userId);
    if (player) player.ready = ready;

    if (state.players.length === 4 && state.players.every(p => p.ready)) {
      await startTournament(tournamentId);
    } else {
      broadcastTournamentState(tournamentId);
    }
  }
}

export async function startTournament(tournamentId: number): Promise<void> {
  const state = activeTournaments[tournamentId];
  if (!state) return;

  const players = state.players;
  const matches: TournamentMatch [] = [
    { id: 1, player1Id: players[0].id, player2Id: players[1].id, matchType: 'semifinal' },
    { id: 2, player1Id: players[2].id, player2Id: players[3].id, matchType: 'semifinal' }
  ];

  for (const match of matches) {
    await insertMatchDB(tournamentId, match.player1Id, match.player2Id, match.matchType);
  }

  state.phase = 'semifinals';
  state.matches = { semifinals: matches };

  for (const match of matches) {
    const gameId = await createAndStartGame({
      player_1_id: match.player1Id,
      player_2_id: match.player2Id,
      tournament_id: tournamentId.toString(),
      match_id: match.id
    });
    await updateMatchWithGameDB(gameId, tournamentId, match.player1Id, match.player2Id);
    sendNotification(match.player1Id, { type: 'tournament_match_ready', payload: { matchId: match.id } });
    sendNotification(match.player2Id, { type: 'tournament_match_ready', payload: { matchId: match.id } });
  }

  broadcastTournamentState(tournamentId);
}

export async function handleGameComplete(gameId: number, winnerId: number): Promise<void> {
  const game = await getGameById(gameId);
  if (!game || !game.id) return;

  const matchRaw = await getMatchById(game.match_id);
  if (!matchRaw) return;

  const match = toTournamentMatch(matchRaw);
  await completeMatchDB(match.id, winnerId);

  const state = activeTournaments[game.tournament_id];
  if (!state) return;

  if (match.matchType === 'semifinal') {
    const semifinals = await getSemifinalWinners(game.tournament_id);
    if (semifinals.length === 2 && semifinals.every(m => m.winner_id)) {
      const [s1, s2] = semifinals;

      // финал
      await insertFinalMatchDB(game.tournament_id, s1.winner_id!, s2.winner_id!);

      // матч за третье место
      const loser1 = s1.player1_id === s1.winner_id ? s1.player2_id : s1.player1_id;
      const loser2 = s2.player1_id === s2.winner_id ? s2.player2_id : s2.player1_id;
      await insertMatchDB(game.tournament_id, loser1, loser2, 'third_place');

      state.phase = 'final'; // можно сделать: semifinals -> third_place -> final (если нужно пошагово)
      broadcastTournamentState(game.tournament_id);
    }
  }

  if (match.matchType === 'final') {
    await setTournamentWinner(game.tournament_id, winnerId);
    const players = await getTournamentPlayers(game.tournament_id);
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
