import { 
	getTotalGamesPlayed, 
	getTotalTournaments, 
	getTournamentWins, 
	startOrdinaryGame 
  } from "../models/game.model";
  import db from "../database";
  import { BallState, GameState, initGameState, PlayerState } from "../@types/game.types";
  import { sendNotification } from "../server";
  
  // Active game state storage
  const gameIntervals: Record<number, NodeJS.Timeout> = {};
  const activeGames: Record<number, GameState> = {};
  
  // AI configuration
  const AI_USER_ID = 999999; // This should match the AI user in the database
  const AI_DIFFICULTY_SETTINGS = {
	easy: { speed: 0.3, reactionDelay: 100, errorMargin: 2 },
	medium: { speed: 0.4, reactionDelay: 50, errorMargin: 1 },
	hard: { speed: 0.5, reactionDelay: 20, errorMargin: 0.5 }
  };
  
  // Returns game statistics from the database for a given user ID.
  export async function getGameStatisticsByIdService(id: number) {
	try {
	  const results = await Promise.all([
		getTotalGamesPlayed(id),
		getTotalTournaments(id),
		getTournamentWins(id),
	  ]);
	  return {
		totalGamesPlayed: results[0],
		totalTournamentsPlayed: results[1],
		totalTournamentsWins: results[2],
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
  
  // AI movement logic
  function updateAIPosition(state: GameState) {
	if (state.player2.userId !== AI_USER_ID) return;

	const difficulty = state.aiDifficulty || 'medium';
	const settings = AI_DIFFICULTY_SETTINGS[difficulty];
	
	const ball = state.ball;
	const ai = state.player2;

	// Only move when ball is coming towards AI
	if (ball.velY > 0) {
	  // Add some prediction of where the ball will be
	  const predictedX = ball.x + (ball.velX * (ball.y - ai.y) / ball.velY);
	  
	  // Add some randomness based on difficulty
	  const targetX = predictedX + (Math.random() - 0.5) * settings.errorMargin;
	  
	  // Move towards the predicted position
	  if (Math.abs(targetX - ai.x) > settings.speed) {
		const direction = targetX > ai.x ? 1 : -1;
		ai.x += direction * settings.speed;
	  }
	  
	  // Ensure AI paddle stays within bounds
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
	  // Offset ball's y slightly above the paddle.
	  ball.y = state.player1.y ;
	  ball.recentCollision = true;
	  setTimeout(() => ball.recentCollision = false, 100);
	}
	
	// Collision with player2 (top paddle).
	if (collisionWithPlayer(state.player2, ball) && !ball.recentCollision) {
	  console.log("Collision with player2");
	  ball.velY = -Math.abs(ball.velY); // Make ball go downward.
	  ball.y = state.player2.y ;
	  ball.recentCollision = true;
	  setTimeout(() => ball.recentCollision = false, 100);
	}
	
	// Scoring conditions.
	if (ball.y < -15) {
	  state.player2.score++;
	  resetBall(ball);
	} else if (ball.y > 15) {
	  state.player1.score++;
	  resetBall(ball);
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
// Примерная функция, где мы задаем paddleWidth и используем ball.radius.
function collisionWithPlayer(player: PlayerState, ball: BallState): boolean {
	const paddleWidth = 1.72; // Примерная ширина ракетки (настройте по необходимости)
	const ballRadius = ball.radius ; // Используем ball.radius, если он задан
	
	// Check vertical difference: должен быть небольшим
	const verticalThreshold = ballRadius ; // можно настроить
	if (Math.abs(ball.y - player.y) <= verticalThreshold) {
	  // Check horizontal overlap:
	  const horizontalThreshold = paddleWidth / 2 + ballRadius;
	  if (Math.abs(ball.x - player.x) <= horizontalThreshold) {

		console.log("Difference in Y:", Math.abs(ball.y - player.y));
		console.log("Difference in X:", Math.abs(ball.x - player.x));
		console.log("Ball radius:", ballRadius);
		console.log("Paddle width:", paddleWidth);
		console.log("Threshold X:", horizontalThreshold);
		console.log("Threshold Y:", verticalThreshold);
		return true;
	  }
	}
	return false;
  }

  // Reset ball position and assign a random initial velocity.
  function resetBall(ball: BallState): void {
	ball.x = 0;
	ball.y = 0;
	ball.velX = (Math.random() - 0.5) * 0.2;
	ball.velY = (Math.random() > 0.5) ? 0.2 : -0.2;
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
  async function endGame(gameId: number, winnerId: number): Promise<void> {
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
	
	const endPayload = {
	  type: 'game_result',
	  gameId,
	  winnerId,
	  score1: state.player1.score,
	  score2: state.player2.score
	};
	
	sendNotification(state.player1.userId, endPayload);
	sendNotification(state.player2.userId, endPayload);
	
	delete activeGames[gameId];
  }
  
  // Create and start a new game with AI
  export async function createAndStartAIGame(playerId: number, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): Promise<number> {
	const gameId = await startOrdinaryGame(playerId, AI_USER_ID);
	
	const state = initGameState(gameId, playerId, AI_USER_ID);
	state.isRunning = false;
	state.aiDifficulty = difficulty;
	
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