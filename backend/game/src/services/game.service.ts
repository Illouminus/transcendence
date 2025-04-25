import { 
	getTotalGamesPlayed, 
	getTotalTournaments, 
	getTournamentWins, 
	getGameWins, 
	getGameLosses, 
	startOrdinaryGame 
  } from "../models/game.model";
  import db from "../database";
  import { BallState, GameState, initGameState, PlayerState } from "../@types/game.types";
  import { sendNotification } from "../server";
  
  // Active game state storage
  const gameIntervals: Record<number, NodeJS.Timeout> = {};
  export const activeGames: Record<number, GameState> = {};
  
  // AI configuration
  const AI_USER_ID = 999999;
  const AI_DIFFICULTY_SETTINGS = {
	easy: { 
	  speed: 0.3, 
	  reactionDelay: 100, 
	  errorMargin: 2,
	  missRate: 0.5,  // Пропускает 50% мячей
	  ballSpeed: 0.15 // Медленная скорость мяча
	},
	medium: { 
	  speed: 0.4, 
	  reactionDelay: 50, 
	  errorMargin: 1,
	  missRate: 0.25, // Пропускает 25% мячей
	  ballSpeed: 0.25 // Средняя скорость мяча
	},
	hard: { 
	  speed: 0.5, 
	  reactionDelay: 20, 
	  errorMargin: 0.5,
	  missRate: 0,    // Не пропускает мячи
	  ballSpeed: 0.35 // Высокая скорость мяча
	}
  };
  
  // Returns game statistics from the database for a given user ID.
  export async function getGameStatisticsByIdService(id: number) {
	try {
	  const results = await Promise.all([
		getTotalGamesPlayed(id),
		getTotalTournaments(id),
		getTournamentWins(id),
		getGameWins(id),
		getGameLosses(id)
	  ]);
	  return {
		totalGamesPlayed: results[0],
		totalTournamentsPlayed: results[1],
		totalTournamentsWins: results[2],
		totalWins: results[3],
		totalLosses: results[4],
	  };
	} catch (error) {
	  throw new Error("Error");
	}
  }
  
  // Update player's horizontal position based on input direction.
  export function updatePlayerPosition(gameId: number, userId: number, direction: 'LEFT' | 'RIGHT') {
	const state = activeGames[gameId];
	if (!state) return;
	
	const speed = 0.5;
	const isPlayer1 = (state.player1.userId === userId);
	const player = isPlayer1 ? state.player1 : state.player2;
	
	// Don't allow AI player to be controlled by input
	if (player.userId === AI_USER_ID) return;
	
	console.log("Player move - User ID:", player.userId);
	
	// Adjust the player's x-position and constrain it within boundaries if needed.
	switch (direction) {
	  case 'LEFT':
		player.x -= speed;
		break;
	  case 'RIGHT':
		player.x += speed;
		break;
	}
	// Example boundary check:
	player.x = Math.min(Math.max(player.x, -10), 10);
	
	// Broadcast the updated state after changing the paddle position.
	broadcastGameState(state);
  }
  
  // AI movement logic with smoother updates and miss probability
  function updateAIPosition(state: GameState) {
	if (state.player2.userId !== AI_USER_ID) return;

	const difficulty = state.aiDifficulty || 'medium';
	const settings = AI_DIFFICULTY_SETTINGS[difficulty];
	
	const ball = state.ball;
	const ai = state.player2;

	// Только двигаемся когда мяч летит к AI
	if (ball.velY > 0) {
	  // Добавляем вероятность пропуска мяча
	  if (Math.random() < settings.missRate) {
		// Намеренно делаем ошибку в движении
		const wrongDirection = ball.x > ai.x ? -1 : 1;
		ai.x += wrongDirection * settings.speed;
	  } else {
		// Предсказываем, где будет мяч
		const predictedX = ball.x + (ball.velX * (ball.y - ai.y) / ball.velY);
		
		// Добавляем случайность в движения
		const targetX = predictedX + (Math.random() - 0.5) * settings.errorMargin;
		
		// Плавно двигаемся к целевой позиции
		const distance = targetX - ai.x;
		const direction = Math.sign(distance);
		const speed = Math.min(Math.abs(distance), settings.speed);
		
		ai.x += direction * speed;
	  }
	  
	  // Убеждаемся, что ракетка не выходит за границы
	  ai.x = Math.min(Math.max(ai.x, -10), 10);
	}
  }
  
  // Main game update loop: moves the ball, checks collisions, and broadcasts game state.
  function updateGame(gameId: number) {
	const state = activeGames[gameId];
	if (!state || !state.isRunning) return;
	
	// Update AI position if this is an AI game
	if (state.player2.userId === AI_USER_ID) {
	  updateAIPosition(state);
	}
	
	const ball = state.ball;
	
	// Update ball position using velocity.
	ball.x += ball.velX;
	ball.y += ball.velY;
	
	// Horizontal boundary: reverse horizontal velocity if outside field.
	if (Math.abs(ball.x) > 6) {
	  ball.velX *= -1;
	}
	
	// Collision with player1 (bottom paddle).
	if (collisionWithPlayer(state.player1, ball) && !ball.recentCollision) {
	  console.log("Collision with player1");
	  ball.velY = Math.abs(ball.velY); // Make ball go upward.
	  ball.y = state.player1.y + 0.6; // Offset ball slightly above the paddle
	  ball.recentCollision = true;
	  setTimeout(() => ball.recentCollision = false, 100);
	}
	
	// Collision with player2 (top paddle).
	if (collisionWithPlayer(state.player2, ball) && !ball.recentCollision) {
	  console.log("Collision with player2");
	  ball.velY = -Math.abs(ball.velY); // Make ball go downward.
	  ball.y = state.player2.y - 0.6; // Offset ball slightly below the paddle
	  ball.recentCollision = true;
	  setTimeout(() => ball.recentCollision = false, 100);
	}
	
	// Scoring conditions.
	if (ball.y < -15) {
	  state.player2.score++;
	  resetBall(ball, state.aiDifficulty);
	} else if (ball.y > 15) {
	  state.player1.score++;
	  resetBall(ball, state.aiDifficulty);
	}
	
	// End game if necessary.
	if (state.player1.score >= 5 || state.player2.score >= 5) {
	  const winnerId = state.player1.score >= 5 ? state.player1.userId : state.player2.userId;
	  endGame(gameId, winnerId);
	  return;
	}
	
	broadcastGameState(state);
  }
  
  // Check collision between a paddle and the ball based on a distance threshold.
  function collisionWithPlayer(player: PlayerState, ball: BallState): boolean {
	const paddleWidth = 3;
	const ballRadius = 0.4;
	
	// Check vertical difference
	const verticalThreshold = ballRadius;
	if (Math.abs(ball.y - player.y) <= verticalThreshold) {
	  // Check horizontal overlap
	  const horizontalThreshold = paddleWidth / 2 + ballRadius;
	  if (Math.abs(ball.x - player.x) <= horizontalThreshold) {
		return true;
	  }
	}
	return false;
  }

  // Reset ball position and assign a random initial velocity based on difficulty
  function resetBall(ball: BallState, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): void {
	const settings = AI_DIFFICULTY_SETTINGS[difficulty];
	ball.x = 0;
	ball.y = 0;
	ball.velX = (Math.random() - 0.5) * settings.ballSpeed;
	ball.velY = (Math.random() > 0.5) ? settings.ballSpeed : -settings.ballSpeed;
	ball.recentCollision = false;
  }
  
  // Broadcast the current game state to both players via the notification system.
  function broadcastGameState(state: GameState): void {
	const payload = {
	  type: "game_update",
	  payload: {
		gameId: state.gameId,
		players: {
		  p1: {  x: state.player1.x, y: state.player1.y, score: state.player1.score },
		  p2: {  x: state.player2.x, y: state.player2.y, score: state.player2.score }
		},
		ball: { x: state.ball.x, y: state.ball.y }
	  }
	};
	
	sendNotification(state.player1.userId, payload);
	sendNotification(state.player2.userId, payload);
  }
  
  // Start the game loop for a given game.
  function startGameLoop(gameId: number): void {
	if (gameIntervals[gameId]) return;
	
	// Начинаем с отсчета
	let countdown = 5;
	const countdownInterval = setInterval(() => {
	  const state = activeGames[gameId];
	  if (!state) {
		clearInterval(countdownInterval);
		return;
	  }

	  // Отправляем текущее значение таймера
	  const countdownPayload = {
		type: 'game_countdown',
		payload: { count: countdown }
	  };
	  sendNotification(state.player1.userId, countdownPayload);
	  sendNotification(state.player2.userId, countdownPayload);

	  countdown--;

	  // Когда отсчет закончен, запускаем игру
	  if (countdown < 0) {
		clearInterval(countdownInterval);
		state.isRunning = true;
		gameIntervals[gameId] = setInterval(() => {
		  updateGame(gameId);
		}, 50);
	  }
	}, 1000);
  }
  
  // End the game: stop loop, update the database, and notify players.
  export async function endGame(gameId: number, winnerId: number): Promise<void> {
	const state = activeGames[gameId];
	if (!state) return;
	
	clearInterval(gameIntervals[gameId]);
	delete gameIntervals[gameId];
	
	state.isRunning = false;
	
	await db.run(`
	  UPDATE games
	  SET winner_id = ?,
		  score_player1 = ?,
		  score_player2 = ?,
		  ended_at = CURRENT_TIMESTAMP
	  WHERE id = ?
	`, [
	  winnerId,
	  state.player1.score,
	  state.player2.score,
	  gameId
	]);
	
	const gameResultPayload = {
	  type: 'game_result',
	  payload: {
		winnerId,
		score1: state.player1.score,
		score2: state.player2.score
	  }
	};
	
	sendNotification(state.player1.userId, gameResultPayload);
	sendNotification(state.player2.userId, gameResultPayload);
	
	delete activeGames[gameId];
  }
  
  // Create and start a new game with AI
  export async function createAndStartAIGame(playerId: number, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): Promise<number> {
	const gameId = await startOrdinaryGame(playerId, AI_USER_ID);
	
	const state = initGameState(gameId, playerId, AI_USER_ID);
	state.isRunning = false;
	state.aiDifficulty = difficulty;
	
	// Initialize ball with correct speed for the difficulty
	resetBall(state.ball, difficulty);
	
	activeGames[gameId] = state;
	startGameLoop(gameId);
	
	return gameId;
  }

  // Create and start a new regular game
  export async function createAndStartGame(data: { player_1_id: number; player_2_id: number }): Promise<number> {
	const gameId = await startOrdinaryGame(data.player_1_id, data.player_2_id);
	
	const state = initGameState(gameId, data.player_1_id, data.player_2_id);
	state.isRunning = false;
	
	activeGames[gameId] = state;
	startGameLoop(gameId);
	
	return gameId;
  }