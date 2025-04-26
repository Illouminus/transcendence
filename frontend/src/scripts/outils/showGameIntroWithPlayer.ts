import { createGameIntro, fadeOutTailwind } from "../../components/gameIntro";
import { UserState } from "../userState";
import { redirectTo } from "../router";
import { DisplayPlayer, MatchPair, TournamentMatch } from "../types/tournament.types";

interface PlayerInfo {
  id: number;
  username: string;
  avatar: string;
}

export function showGameIntroWithPlayers(gameId: number, player1: PlayerInfo, player2: PlayerInfo) {

  console.log("showGameIntroWithPlayers BETWEEN MTACHES", player1, player2);
  const intro = createGameIntro({
    player1,
    player2,
    onReady: () => {
      fadeOutTailwind(intro, () => {
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
      });
    }
  });

  document.body.appendChild(intro);
}



// Конвертирует матч в красивую структуру
export function mapTournamentMatchToDisplay(match: TournamentMatch): MatchPair {
  const user = UserState.getUser();
  if (!user) throw new Error('User not logged in');

  function getPlayerInfo(playerId: number): DisplayPlayer {
    if (user && playerId === user.id) {
      return {
        id: user.id,
        username: user.username,
        avatar: "http://localhost:8080/user" + (user.avatar || '/images/default_avatar.png'),
        status: 'playing'
      };
    }
    const friend = user?.friends.find(f => f.friend_id === playerId);
    if (!friend) {
      throw new Error(`Player with ID ${playerId} not found among friends or yourself`);
    }
    return {
      id: friend.friend_id,
      username: friend.friend_username,
      avatar: "http://localhost:8080/user" + (friend.friend_avatar || '/images/default_avatar.png'),
      status: 'playing'
    };
  }

  const player1 = getPlayerInfo(match.player1Id);
  const player2 = getPlayerInfo(match.player2Id);

  return {
    player1,
    player2,
    winner: match.winner
  };
}