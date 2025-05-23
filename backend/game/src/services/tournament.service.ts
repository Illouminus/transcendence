import { sendNotification, sendNotificationToAll } from '../server';
import { createAndStartGame, receiveGameReady } from './game.service';
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
  leaveTournamentDB,
  setTournamentWinner,
  updateMatchWithGameDB,
  updateReadyDB
} from '../models/tournament.model';
import { activeTournaments } from '../state/tournament.state';
import { DbTournamentMatch, TournamentMatch, TournamentPlayer, TournamentState } from '../@types/tournament.types';
import { MathType } from '../@types/game.types';

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

export async function createTournament(hostId: number, alias: string): Promise<number> {
  const tournamentId = await createTournamentDB(hostId);
  await insertUserTournamentDB(tournamentId, hostId, alias);

  activeTournaments[tournamentId] = {
    tournamentId,
    phase: 'waiting',
    players: [{ id: hostId, ready: false, alias }]
  };

  broadcastTournamentState(tournamentId);
  return tournamentId;
}


export async function joinTournament(tournamentId: number, userId: number, alias: string): Promise<void> {
  const tournament = await getTournamentDB(tournamentId);
  if (!tournament || tournament.status !== 'waiting') {
    sendNotification(userId, {
      type: 'error',
      payload: {
        message: 'Tournament not available for joining'
      }
    });
    return;
  }


  const players = await getExistingPlayersDB(tournamentId);
  if (players.includes(userId)) {
  console.log(" USER ID EXISTING : ", userId);
    sendNotification(userId, {
      type: 'error',
      payload: {
        message: 'You are already in this tournament'
      }
    });
    return;
  }
  await insertUserTournamentDB(tournamentId, userId, alias);

  const state = activeTournaments[tournamentId];
  if (state) {
    state.players.push({ id: userId, ready: false, alias });
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
  const match1Id = await insertMatchDB(tournamentId, players[0].id, players[1].id, 'semifinal');
  const match2Id = await insertMatchDB(tournamentId, players[2].id, players[3].id, 'semifinal');

  const matches: TournamentMatch[] = [
    { id: match1Id, player1Id: players[0].id, player2Id: players[1].id, matchType: 'semifinal' },
    { id: match2Id, player1Id: players[2].id, player2Id: players[3].id, matchType: 'semifinal' }
  ];

  state.phase = 'semifinals';
  state.matches = { semifinals: matches, final: undefined };

  for (const match of matches) {
    const gameId = await createAndStartGame({
      player_1_id: match.player1Id,
      player_2_id: match.player2Id,
      game_type: 'tournament',
      tournament_id: tournamentId,
      match_id: match.id,
      match_type: MathType.SEMIFINAL
    });

    await updateMatchWithGameDB(gameId, tournamentId, match.player1Id, match.player2Id);

    sendNotification(match.player1Id, {
      type: 'tournament_match_start',
      payload: {
        gameId,
        opponentId: match.player2Id,
        opponentAlias: state.players.find(p => p.id === match.player2Id)?.alias,
        matchType: match.matchType,
        isPlayer1: true,
        pending: true,
        matches: { semifinals: matches, final: undefined }
      }
    });

    console.log("Ehat we send to player 1: ", {
      gameId,
      opponentId: match.player2Id,
      opponentAlias: state.players.find(p => p.id === match.player2Id)?.alias,
      matchType: match.matchType,
      isPlayer1: true,
      pending: true,
      matches: { semifinals: matches, final: undefined }
    });
    console.log("Ehat we send to player 2: ", {
      gameId,
      opponentId: match.player1Id,
      opponentAlias: state.players.find(p => p.id === match.player1Id)?.alias,
      matchType: match.matchType,
      isPlayer1: false,
      pending: true,
      matches: { semifinals: matches, final: undefined }
    });

    sendNotification(match.player2Id, {
      type: 'tournament_match_start',
      payload: {
        gameId,
        opponentId: match.player1Id,
        opponentAlias: state.players.find(p => p.id === match.player1Id)?.alias,
        matchType: match.matchType,
        isPlayer1: false,
        pending: true,
        matches: { semifinals: matches, final: undefined } 
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

      const finalMatchId = await insertFinalMatchDB(tournamentId, finalPlayer1, finalPlayer2);
      await updateMatchWithGameDB(finalMatchId, tournamentId, finalPlayer1, finalPlayer2);


      state.phase = 'final';
      

      const finalGameId = await createAndStartGame({
        player_1_id: finalPlayer1,
        player_2_id: finalPlayer2,
        game_type: 'tournament',
        tournament_id: tournamentId,
        match_id: finalMatchId,
        match_type: MathType.FINAL
      });

      

      state.matches = {
        semifinals: state.matches?.semifinals || [],
        final: {
          id: finalMatchId,
          gameId: finalGameId,
          player1Id: finalPlayer1,
          player2Id: finalPlayer2,
          matchType: 'final'
        }
      };

      for (const [playerId, opponentId, isPlayer1] of [
        [finalPlayer1, finalPlayer2, true],
        [finalPlayer2, finalPlayer1, false]
      ] as const) {


        console.log('Sending notification to player:', playerId, 'opponent:', opponentId);
        console.log('Final match data:', {
          gameId: finalGameId,
          opponentId,
          opponentAlias: state.players.find(p => p.id === opponentId)?.alias,
          matchType: 'final',
          isPlayer1,
          matches: {
            semifinals: state.matches?.semifinals || [],
            final: {
              player1Id: finalPlayer1,
              player2Id: finalPlayer2,
              gameId: finalGameId
            }
          }
        });


        state.phase = 'final';
        broadcastTournamentState(tournamentId);


        sendNotification(playerId, {
          type: 'tournament_match_start',
          payload: {
            gameId: finalGameId,
            opponentId,
            opponentAlias: state.players.find(p => p.id === opponentId)?.alias,
            matchType: 'final',
            isPlayer1,
            matches: {
              semifinals: state.matches?.semifinals || [],
              final: {
                player1Id: finalPlayer1,
                player2Id: finalPlayer2,
                gameId: finalGameId
              }
            }
          }
        });
      }
    }
  }

  if (match.matchType === 'final') {
    const { player1Id, player2Id } = match;
    const loserId = player1Id === winnerId ? player2Id : player1Id;
  
    // Получаем всех участников турнира
    const players = await getTournamentPlayers(tournamentId); // [ { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 } ]
  
    // Убираем из массива тех, кто победил или проиграл в финале => остаются полуфиналисты
    const thirdAndFourth = players.filter(p => p.user_id !== winnerId && p.user_id!== loserId);
  
    const podium = [
      { userId: winnerId, place: 1 },
      { userId: loserId, place: 2 },
      { userId: thirdAndFourth[0]?.user_id ?? 0, place: 3 },
      { userId: thirdAndFourth[1]?.user_id ?? 0, place: 4 }
    ];
  

    console.log('Tournament completed: ', podium);
    // Рассылаем всем 4 участникам уведомление
    for (const player of players) {
      sendNotification(player.user_id, {
        type: 'tournament_completed',
        payload: {
          podium
        }
      });
    }
  
    state.phase = 'completed';
    delete activeTournaments[tournamentId];
    await setTournamentWinner(tournamentId, winnerId);
    return;
  }
}



export async function leaveTournament(tournamentId: number, userId: number): Promise<void> {
  const state = activeTournaments[tournamentId];
  if (!state) return;

  const playerIndex = state.players.findIndex(p => p.id === userId);
  if (playerIndex !== -1) {
    state.players.splice(playerIndex, 1);
    await leaveTournamentDB(tournamentId, userId);
    broadcastTournamentState(tournamentId);
    for(const player of state.players) {
      sendNotification(player.id, {
        type: 'tournament_player_left',
        payload: { userId, tournamentId }
      });
    }
    if (state.players.length === 0 ) {
      console.log("Tournament is empty, deleting it");
      delete activeTournaments[tournamentId];
      sendNotificationToAll({
        type: 'tournament_deleted',
        payload: { tournamentId }
      })
      return;
    }
  }
}