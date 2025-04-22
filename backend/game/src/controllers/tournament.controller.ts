import { WebSocket } from 'ws';
import { createTournament, joinTournament, toggleReady } from '../service/tournament.service';
import { sendNotification, sendNotificationToAll } from '../../server';

export async function handleCreateTournament(userId: number, connection: WebSocket) {
  const tournamentId = await createTournament(userId);

  connection.send(JSON.stringify({
    type: 'tournament_created',
    payload: { tournamentId, hostId: userId }
  }));

  sendNotificationToAll({
    type: 'new_tournament_created',
    payload: { tournamentId, hostId: userId }
  });
}

export async function handleJoinTournament(tournamentId: number | null, userId: number, connection: WebSocket) {
  if (!tournamentId) {
    await handleCreateTournament(userId, connection);
    return;
  }
  await joinTournament(tournamentId, userId);
}

export async function handleToggleReady(tournamentId: number, userId: number, ready: boolean) {
  await toggleReady(tournamentId, userId, ready);
}