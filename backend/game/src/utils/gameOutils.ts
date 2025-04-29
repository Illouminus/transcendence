// outils.ts

import { GameState } from '../@types/game.types';
import { playerReady } from '../services/game.service';


export function markPlayerReady(gameId: number, userId: number): void {
  console.log('Marking player as ready:', gameId, userId);
  if (!playerReady[gameId]) {
    playerReady[gameId] = new Set();
  }
  playerReady[gameId].add(userId);
}

export function isGameReady(gameId: number, activeGames: Record<number, GameState>, readyState: Record<number, Set<number>>): boolean {
  const state = activeGames[gameId];
  if (!state) return false;

  const ready = readyState[gameId];


  return ready?.has(state.player1.userId) && ready?.has(state.player2.userId);
}

