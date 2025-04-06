import { getTotalGamesPlayed, getTotalTournaments, getTournamentWins, startOrdinaryGame } from "../models/game.model";
import db from "../database";
import { BallState, GameState, initGameState, PlayerState } from "../@types/game.types";


const gameIntervals: Record<number, NodeJS.Timeout> = {};
const activeGames: Record<number, GameState> = {}; 


export async function getGameStatisticsByIdService(id: number) {
	try {
	const dbTest = await Promise.all([
		getTotalGamesPlayed(id),
		getTotalTournaments(id),
		getTournamentWins(id),
	]);
	return {
		totalGamesPlayed: dbTest[0],
		totalTournamentsPlayed: dbTest[1],
		totalTournamentsWins: dbTest[2],
	}
	} catch (error) {
		throw new Error("Error");
	}
}


export function updatePlayerPosition(gameId: number, userId: number, direction: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN') {
	const state = activeGames[gameId];
	if (!state) return;  // На случай, если игра не найдена
  
	// Допустим, скорость движения
	const speed = 0.5;
  
	// Определяем, какой из игроков управляется этим userId
	const isPlayer1 = (state.player1.userId === userId);
	const player = isPlayer1 ? state.player1 : state.player2;
  
	switch (direction) {
	  case 'LEFT':
		player.x -= speed;
		break;
	  case 'RIGHT':
		player.x += speed;
		break;
	  case 'UP':
		player.y += speed;
		break;
	  case 'DOWN':
		player.y -= speed;
		break;
	}
  
	// Можно добавить логику "границ", чтобы нельзя было уйти слишком далеко.
	// Пример:
	// player.x = Math.min(Math.max(player.x, -10), 10);
  }



async function endGame(gameId: number, winnerId: number) {
	const state = activeGames[gameId];
	if (!state) return;
  
	// 1. Останавливаем цикл
	clearInterval(gameIntervals[gameId]);
	delete gameIntervals[gameId];
  
	// 2. Ставим isRunning = false
	state.isRunning = false;
  
	// 3. Записываем в БД результаты
	//    (например, нужно определить score_player1 / score_player2)
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
  
	// // 4. Шлём финальное сообщение о завершении игры
	// const p1Socket = activeConnections.get(state.player1.userId);
	// const p2Socket = activeConnections.get(state.player2.userId);
  
	// const endPayload = {
	//   type: 'GAME_END',
	//   gameId,
	//   winnerId,
	//   score1: state.player1.score,
	//   score2: state.player2.score
	// };
	// const endJson = JSON.stringify(endPayload);
  
	// p1Socket?.send(endJson);
	// p2Socket?.send(endJson);
  
	// 5. Можно удалить из памяти: 
	delete activeGames[gameId];
  }


function updateGame(gameId: number) {
	const state = activeGames[gameId];

	if (!state || !state.isRunning) return;
  
	const ball = state.ball;
	ball.x += ball.velX;
	ball.y += ball.velY;
  
	// 2. Проверка "стен" по X (пример – если x > 10 или x < -10, меняем направление)
	if (Math.abs(ball.x) > 10) {
	  ball.velX *= -1;
	}
  
	// 3. Проверка столкновений с "ракетками" (player1, player2)
	//    Например, если расстояние по Y между ball и player1 ~ 1, а по X они близко, считаем отражение.
	//    Пример (на ваше усмотрение — зависит от логики Pong/Tennis).
	if (collisionWithPlayer(state.player1, ball)) {
	  ball.velY = Math.abs(ball.velY); // Отскок вверх
	}
	if (collisionWithPlayer(state.player2, ball)) {
	  ball.velY = -Math.abs(ball.velY); // Отскок вниз
	}
  
	// 4. Проверка, не улетел ли мяч за край по Y
	if (ball.y < -12) {
	  // Очко игроку2
	  state.player2.score++;
	  resetBall(ball);
	} else if (ball.y > 12) {
	  // Очко игроку1
	  state.player1.score++;
	  resetBall(ball);
	}
  
	// 5. Проверяем, нет ли победителя
	if (state.player1.score >= 5 || state.player2.score >= 5) {
	  let winnerId = state.player1.score >= 5 ? state.player1.userId : state.player2.userId;
	  endGame(gameId, winnerId);
	  return;
	}
  
	// 6. Рассылаем обновлённое состояние по WebSocket
	//broadcastGameState(state);
  }
  
  // Пример простой проверки коллизии
  function collisionWithPlayer(player: PlayerState, ball: BallState) {
	// Например, если расстояние по оси Y между player.y и ball.y < 1.0 
	// и расстояние по X < 1.0, считаем столкновение
	// (Зависит от того, как вы храните размеры "ракеток" и т.д.)
	const dx = ball.x - player.x;
	const dy = ball.y - player.y;
	const distance = Math.sqrt(dx*dx + dy*dy);
	return distance < 1.0;
  }
  
  function resetBall(ball: BallState) {
	ball.x = 0;
	ball.y = 0;
	// случайное направление, чтобы не было однообразия
	ball.velX = (Math.random() - 0.5) * 0.2;
	ball.velY = (Math.random() > 0.5) ? 0.2 : -0.2;
  }
  
//   function broadcastGameState(state: GameState) {
// 	// Находим WebSocket’ы двух игроков.
// 	// Допустим, у нас есть activeConnections: Map<number, WebSocket>
// 	const p1Socket = activeConnections.get(state.player1.userId);
// 	const p2Socket = activeConnections.get(state.player2.userId);
  
// 	// Рассылаем обоим
// 	const payload = {
// 	  type: "GAME_UPDATE",
// 	  gameId: state.gameId,
// 	  players: {
// 		p1: { x: state.player1.x, y: state.player1.y, score: state.player1.score },
// 		p2: { x: state.player2.x, y: state.player2.y, score: state.player2.score }
// 	  },
// 	  ball: {
// 		x: state.ball.x,
// 		y: state.ball.y
// 	  }
// 	};
  
// 	const json = JSON.stringify(payload);
  
// 	p1Socket?.send(json);
// 	p2Socket?.send(json);
//   }

function startGameLoop(gameId: number) {
	if (gameIntervals[gameId]) return;
  
	gameIntervals[gameId] = setInterval(() => {
	  updateGame(gameId);
	}, 50); 
  }



  
export async function createAndStartGame(data: { player_1_id: number; player_2_id: number }) {

  const gameId  = await startOrdinaryGame(data.player_1_id, data.player_2_id);

  const state = initGameState(gameId, data.player_1_id, data.player_2_id);
  console.log("Game state initialized:", state);
  // Сохраняем состояние игры в базе данных или в памяти
  activeGames[gameId] = state;
  // Запускаем игровой цикл

  startGameLoop(gameId);
  return gameId;
}