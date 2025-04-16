export type AIDifficulty = 'easy' | 'medium' | 'hard';

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
    aiDifficulty?: AIDifficulty;
  }
  
  
  export function initGameState(gameId: number, player1Id: number, player2Id: number): GameState {
    return {
      gameId,
      player1: {
        userId: player1Id,
        x: 0,
        y: -12,
        score: 0
      },
      player2: {
        userId: player2Id,
        x: 0,
        y: 12,
        score: 0
      },
      ball: {
        x: 0,
        y: 0,
        velX: (Math.random() - 0.5) * 0.2,
        velY: 0.2,
        radius: 0.5,
        recentCollision: false
      },
      isRunning: false
    };
  }
  
  // Запускаем цикл игры, сохраняя идентификатор setInterval, чтобы потом можно было остановить
