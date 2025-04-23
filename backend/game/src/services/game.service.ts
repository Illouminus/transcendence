import { sendNotification } from '../server';
import { BallState, GameState, PlayerState, initGameState } from '../@types/game.types';
import { GameType } from '../@types/tournament.types';
import { handleGameComplete } from './tournament.service';
import {
  insertGameDB,
  updateGameResultDB,
  getGameMetaDB
} from '../models/game.model';
import { isGameReady, markPlayerReady } from '../utils/gameOutils';

const gameIntervals: Record<number, ReturnType<typeof setInterval>> = {};
export const activeGames: Record<number, GameState> = {};
export const playerReady: Record<number, Set<number>> = {};

const AI_USER_ID = 999999;
const AI_DIFFICULTY_SETTINGS = {
  easy: { speed: 0.3, reactionDelay: 100, errorMargin: 2, missRate: 0.5, ballSpeed: 0.15 },
  medium: { speed: 0.4, reactionDelay: 50, errorMargin: 1, missRate: 0.25, ballSpeed: 0.25 },
  hard: { speed: 0.5, reactionDelay: 20, errorMargin: 0.5, missRate: 0, ballSpeed: 1 }
};

interface CreateGameParams {
  player_1_id: number;
  player_2_id: number;
  game_type?: GameType;
  tournament_id?: number;
  match_id?: number;
}

export function receiveGameReady(gameId: number, userId: number): void {
  markPlayerReady(gameId, userId);
  if (isGameReady(gameId, activeGames, playerReady)) {
    startGameLoop(gameId);
  }
}

export async function createAndStartGame(params: CreateGameParams): Promise<number> {
  const gameId = await insertGameDB(
    params.player_1_id,
    params.player_2_id,
    params.game_type || 'casual',
    params.match_id
  );

  const state = initGameState(gameId, params.player_1_id, params.player_2_id, params.game_type || 'casual');
  state.isRunning = false;
  state.tournamentMatchId = params.match_id;
  state.gameType = params.game_type || 'casual';

  activeGames[gameId] = state;
  playerReady[gameId] = new Set();

  return gameId;
}

export async function createAndStartAIGame(playerId: number, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): Promise<number> {
  const gameId = await insertGameDB(playerId, AI_USER_ID, 'ai');

  const state = initGameState(gameId, playerId, AI_USER_ID, 'ai');
  state.isRunning = false;
  state.aiDifficulty = difficulty;

  resetBall(state.ball, difficulty);
  activeGames[gameId] = state;
  //startGameLoop(gameId);
  receiveGameReady(gameId, playerId);
  receiveGameReady(gameId, AI_USER_ID);
  return gameId;
}

export async function endGame(gameId: number, winnerId: number): Promise<void> {
  const state = activeGames[gameId];
  if (!state) return;

  clearInterval(gameIntervals[gameId]);
  delete gameIntervals[gameId];
  state.isRunning = false;

  const meta = await getGameMetaDB(gameId);
  if (!meta) throw new Error(`Game ${gameId} not found in DB`);

  await updateGameResultDB(gameId, winnerId, state.player1.score, state.player2.score);

  const payload = {
    type: 'game_result',
    game_type: meta.game_type,
    payload: {
      winnerId,
      score1: state.player1.score,
      score2: state.player2.score
    }
  };
  sendNotification(state.player1.userId, payload);
  sendNotification(state.player2.userId, payload);

  if (meta.game_type === 'tournament') {
    await handleGameComplete(meta.tournament_match_id!, winnerId);
  }

  delete activeGames[gameId];
}

export function updatePlayerPosition(gameId: number, userId: number, direction: 'LEFT' | 'RIGHT') {
  const state = activeGames[gameId];
  if (!state) return;

  const player = state.player1.userId === userId ? state.player1 : state.player2;
  if (player.userId === AI_USER_ID) return;

  const speed = 0.5;
  player.x += direction === 'LEFT' ? -speed : speed;
  player.x = Math.min(Math.max(player.x, -10), 10);
  broadcastGameState(state);
}

function broadcastGameState(state: GameState): void {
  const payload = {
    type: 'game_update',
    payload: {
      gameId: state.gameId,
      players: {
        p1: { x: state.player1.x, y: state.player1.y, score: state.player1.score },
        p2: { x: state.player2.x, y: state.player2.y, score: state.player2.score }
      },
      ball: { x: state.ball.x, y: state.ball.y }
    }
  };
  sendNotification(state.player1.userId, payload);
  sendNotification(state.player2.userId, payload);
}

function startGameLoop(gameId: number): void {
  if (gameIntervals[gameId]) return;
  let countdown = 5;

  const countdownInterval = setInterval(() => {
    const state = activeGames[gameId];
    if (!state) return clearInterval(countdownInterval);

    const payload = { type: 'game_countdown', payload: { count: countdown } };
    sendNotification(state.player1.userId, payload);
    sendNotification(state.player2.userId, payload);
    countdown--;

    if (countdown < 0) {
      clearInterval(countdownInterval);
      state.isRunning = true;
      gameIntervals[gameId] = setInterval(() => updateGame(gameId), 50);
    }
  }, 1000);
}

function updateGame(gameId: number): void {
  const state = activeGames[gameId];
  if (!state?.isRunning) return;

  const ball = state.ball;
  if (state.player2.userId === AI_USER_ID) updateAIPosition(state);

  ball.x += ball.velX;
  ball.y += ball.velY;
  if (Math.abs(ball.x) > 6) ball.velX *= -1;

  if (collisionWithPlayer(state.player1, ball) && !ball.recentCollision) {
    ball.velY = Math.abs(ball.velY);
    ball.y = state.player1.y + 0.6;
    ball.recentCollision = true;
    setTimeout(() => (ball.recentCollision = false), 100);
  }

  if (collisionWithPlayer(state.player2, ball) && !ball.recentCollision) {
    ball.velY = -Math.abs(ball.velY);
    ball.y = state.player2.y - 0.6;
    ball.recentCollision = true;
    setTimeout(() => (ball.recentCollision = false), 100);
  }

  if (ball.y < -15 || ball.y > 15) {
    ball.y < -15 ? state.player2.score++ : state.player1.score++;
    resetBall(ball, state.aiDifficulty);
  }

  if (state.player1.score >= 5 || state.player2.score >= 5) {
    const winnerId = state.player1.score >= 5 ? state.player1.userId : state.player2.userId;
    void endGame(gameId, winnerId);
    return;
  }

  broadcastGameState(state);
}

function collisionWithPlayer(player: PlayerState, ball: BallState): boolean {
  const paddleWidth = 3, ballRadius = 0.4;
  return Math.abs(ball.y - player.y) <= ballRadius &&
         Math.abs(ball.x - player.x) <= paddleWidth / 2 + ballRadius;
}

function resetBall(ball: BallState, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): void {
  const settings = AI_DIFFICULTY_SETTINGS[difficulty];
  ball.x = 0;
  ball.y = 0;
  ball.velX = (Math.random() - 0.5) * settings.ballSpeed;
  ball.velY = (Math.random() > 0.5 ? 1 : -1) * settings.ballSpeed;
  ball.recentCollision = false;
}

function updateAIPosition(state: GameState): void {
  const ai = state.player2;
  const ball = state.ball;
  const settings = AI_DIFFICULTY_SETTINGS[state.aiDifficulty || 'medium'];

  if (ball.velY > 0) {
    const predictedX = ball.x + (ball.velX * (ball.y - ai.y) / ball.velY);
    const targetX = predictedX + (Math.random() - 0.5) * settings.errorMargin;
    const direction = Math.sign(targetX - ai.x);
    ai.x += direction * Math.min(Math.abs(targetX - ai.x), settings.speed);
    ai.x = Math.min(Math.max(ai.x, -10), 10);
  }
}