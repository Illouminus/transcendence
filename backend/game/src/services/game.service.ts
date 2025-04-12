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
  
  // Main game update loop: moves the ball, checks collisions, and broadcasts game state.
  function updateGame(gameId: number) {
	const state = activeGames[gameId];
	if (!state || !state.isRunning) return;
	
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
	  ball.y = state.player1.y + 1.0;
	  ball.recentCollision = true;
	  setTimeout(() => ball.recentCollision = false, 100);
	}
	
	// Collision with player2 (top paddle).
	if (collisionWithPlayer(state.player2, ball) && !ball.recentCollision) {
	  console.log("Collision with player2");
	  ball.velY = -Math.abs(ball.velY); // Make ball go downward.
	  ball.y = state.player2.y - 1.0;
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
	const paddleWidth = 0.5; // Примерная ширина ракетки (настройте по необходимости)
	const ballRadius = ball.radius || 1.73; // Используем ball.radius, если он задан
	
	// Check vertical difference: должен быть небольшим
	const verticalThreshold = ballRadius + 0.1; // можно настроить
	if (Math.abs(ball.y - player.y) <= verticalThreshold) {
	  // Check horizontal overlap:
	  const horizontalThreshold = paddleWidth / 2 + ballRadius;
	  if (Math.abs(ball.x - player.x) <= horizontalThreshold) {
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
		  p1: { x: state.player1.x, y: state.player1.y, score: state.player1.score },
		  p2: { x: state.player2.x, y: state.player2.y, score: state.player2.score }
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
	
	gameIntervals[gameId] = setInterval(() => {
	  updateGame(gameId);
	}, 50);
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
  
  // Create and start a new game: initialize state, store it, and start the loop.
  export async function createAndStartGame(data: { player_1_id: number; player_2_id: number }): Promise<number> {
	const gameId = await startOrdinaryGame(data.player_1_id, data.player_2_id);
	console.log("Game started with ID:", gameId);
	
	const state = initGameState(gameId, data.player_1_id, data.player_2_id);
	console.log("Game state initialized:", state);
	
	activeGames[gameId] = state;
	startGameLoop(gameId);
	
	return gameId;
  }