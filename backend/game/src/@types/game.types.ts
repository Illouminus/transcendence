export interface PlayerState {
    userId: number;
    x: number;  
    y: number;
    score: number;
  }
  
export interface BallState {
    x: number;
    y: number;
    velX: number;
    velY: number;
    radius: number;
    recentCollision?: boolean; // Optional property to track recent collision
  }
  
export interface GameState {
    gameId: number;       
    player1: PlayerState;
    player2: PlayerState;
    ball: BallState;
    isRunning: boolean;
  }
  
  
  export function initGameState(gameId: number, player1Id: number, player2Id: number): GameState {
    return {
      gameId,
      player1: {
        userId: player1Id,
        x: 0,
        y: -10,
        score: 0
      },
      player2: {
        userId: player2Id,
        x: 0,
        y: 10,
        score: 0
      },
      ball: {
        x: 0,
        y: 0,
        velX: 0.1,
        velY: 0.1,
        radius: 0.3
      },
      isRunning: true
    };
  }
  
  // Запускаем цикл игры, сохраняя идентификатор setInterval, чтобы потом можно было остановить
