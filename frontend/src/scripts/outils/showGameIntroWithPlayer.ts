import { createGameIntro } from "../../components/gameIntro";
import { UserState } from "../userState";
import { redirectTo } from "../router";

interface PlayerInfo {
  id: number;
  username: string;
  avatar: string;
}

export function showGameIntroWithPlayers(gameId: number, player1: PlayerInfo, player2: PlayerInfo) {
  const intro = createGameIntro({
    player1,
    player2,
    onReady: () => {
      intro.remove();
      const socket = UserState.getGameSocket();
      const currentUser = UserState.getUser();
      if (socket && currentUser) {
        socket.send(JSON.stringify({
          type: 'game_ready',
          payload: {
            gameId,
            userId: currentUser.id
          }
        }));
      }
      redirectTo('/pong');
    }
  });

  document.body.appendChild(intro);
}