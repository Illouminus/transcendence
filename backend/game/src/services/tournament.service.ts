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
  await insertUserTournamentDB(tournamentId, userId);

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
  // const matches: TournamentMatch [] = [
  //   { id: 1, player1Id: players[0].id, player2Id: players[1].id, matchType: 'semifinal' },
  //   { id: 2, player1Id: players[2].id, player2Id: players[3].id, matchType: 'semifinal' }
  // ];

  // for (const match of matches) {
  //   await insertMatchDB(tournamentId, match.player1Id, match.player2Id, match.matchType);
  // }
  const match1Id = await insertMatchDB(tournamentId, players[0].id, players[1].id, 'semifinal');
  const match2Id = await insertMatchDB(tournamentId, players[2].id, players[3].id, 'semifinal');

  console.log("Match IDsSSSSSSS: ", match1Id, match2Id);
  const matches: TournamentMatch[] = [
    { id: match1Id, player1Id: players[0].id, player2Id: players[1].id, matchType: 'semifinal' },
    { id: match2Id, player1Id: players[2].id, player2Id: players[3].id, matchType: 'semifinal' }
  ];

  state.phase = 'semifinals';
  state.matches = { semifinals: matches };

  for (const match of matches) {
    const gameId = await createAndStartGame({
      player_1_id: match.player1Id,
      player_2_id: match.player2Id,
      game_type: 'tournament',
      tournament_id: tournamentId,
      match_id: match.id
    });

    await updateMatchWithGameDB(gameId, tournamentId, match.player1Id, match.player2Id);

    sendNotification(match.player1Id, {
      type: 'tournament_match_start',
      payload: {
        gameId,
        opponentId: match.player2Id,
        matchType: match.matchType,
      }
    });

    sendNotification(match.player2Id, {
      type: 'tournament_match_start',
      payload: {
        gameId,
        opponentId: match.player1Id,
        matchType: match.matchType,
      }
    });
  }

  broadcastTournamentState(tournamentId);
}

export async function handleGameComplete(matchId: number, winnerId: number): Promise<void> {
  const matchRaw = await getMatchById(matchId);
  if (!matchRaw) return;

  const match = toTournamentMatch(matchRaw);
  await completeMatchDB(match.id, winnerId);

  const tournamentId = matchRaw.tournament_id;
  const state = activeTournaments[tournamentId];
  if (!state) return;

  if (match.matchType === 'semifinal') {
    const semifinals = await getSemifinalWinners(tournamentId);

    if (semifinals.length === 2 && semifinals.every(m => m.winner_id)) {
      const [s1, s2] = semifinals;

      const finalPlayer1 = s1.winner_id!;
      const finalPlayer2 = s2.winner_id!;
      const loser1 = s1.player1_id === s1.winner_id ? s1.player2_id : s1.player1_id;
      const loser2 = s2.player1_id === s2.winner_id ? s2.player2_id : s2.player1_id;

      const finalMatchId = await insertFinalMatchDB(tournamentId, finalPlayer1, finalPlayer2);
      await updateMatchWithGameDB(finalMatchId, tournamentId, finalPlayer1, finalPlayer2);
      const thirdPlaceMatchId = await insertMatchDB(tournamentId, loser1, loser2, 'third_place');
      await updateMatchWithGameDB(thirdPlaceMatchId, tournamentId, loser1, loser2);

      const finalGameId = await createAndStartGame({
        player_1_id: finalPlayer1,
        player_2_id: finalPlayer2,
        game_type: 'tournament',
        tournament_id: tournamentId,
        match_id: finalMatchId
      });

      const thirdPlaceGameId = await createAndStartGame({
        player_1_id: loser1,
        player_2_id: loser2,
        game_type: 'tournament',
        tournament_id: tournamentId,
        match_id: thirdPlaceMatchId
      });

      sendNotification(finalPlayer1, {
        type: 'tournament_match_start',
        payload: {
          gameId: finalGameId,
          opponentId: finalPlayer2,
          matchType: 'final'
        }
      });

      sendNotification(finalPlayer2, {
        type: 'tournament_match_start',
        payload: {
          gameId: finalGameId,
          opponentId: finalPlayer1,
          matchType: 'final'
        }
      });

      sendNotification(loser1, {
        type: 'tournament_match_start',
        payload: {
          gameId: thirdPlaceGameId,
          opponentId: loser2,
          matchType: 'third_place'
        }
      });

      sendNotification(loser2, {
        type: 'tournament_match_start',
        payload: {
          gameId: thirdPlaceGameId,
          opponentId: loser1,
          matchType: 'third_place'
        }
      });

      state.phase = 'final';
      broadcastTournamentState(tournamentId);
    }
  }

  if (match.matchType === 'final') {
    await setTournamentWinner(tournamentId, winnerId);
    const players = await getTournamentPlayers(tournamentId);

    for (const player of players) {
      sendNotification(player.user_id, {
        type: 'tournament_completed',
        payload: {
          podium: players.map((p) => ({
            userId: p.user_id,
            place: p.user_id === winnerId ? 1 : 0
          }))
        }
      });
    }

    state.phase = 'completed';
    broadcastTournamentState(tournamentId);
  }
}