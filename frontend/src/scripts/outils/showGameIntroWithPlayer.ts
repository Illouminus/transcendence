import { createGameIntro, fadeOutTailwind } from "../../components/gameIntro";
import { UserState } from "../userState";
import { redirectTo } from "../router";
import { DisplayPlayer, MatchPair, TournamentMatch } from "../types/tournament.types";
import { BASE_URL } from "./config";

interface PlayerInfo {
  id: number;
  username: string;
  avatar: string;
}

let gameReadyModal: HTMLElement | null = null;

export function showGameIntroWithPlayers(gameId: number, player1: PlayerInfo, player2: PlayerInfo) {
  console.log("showGameIntroWithPlayers BETWEEN MATCHES", player1, player2);


  console.log("The old modal is", gameReadyModal);

  if (gameReadyModal) {
    console.log("Removing old game ready modal");
    fadeOutTailwind(gameReadyModal, () => {
      gameReadyModal?.remove();
      gameReadyModal = null;
    });
  }

  const intro = createGameIntro({
    player1,
    player2,
    onReady: () => {
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

      intro.remove();
      if (gameReadyModal === intro) {
        gameReadyModal = null;
      }
        redirectTo('/pong');
    }
  });

  document.body.appendChild(intro);
  gameReadyModal = intro;
}

function getPlayerInfo(playerId: number): DisplayPlayer {
  const user = UserState.getUser();
  const tournament = UserState.getTournamentState();
  if (!tournament) throw new Error('Tournament not found');
  if (!user) throw new Error('User not logged in');
  
  const player = tournament.players.find(p => p.id === playerId);
  if (!player) throw new Error(`Player with ID ${playerId} not found in tournament`);
  // We need to take the alias of player 1 or 2

  if (user && playerId === user.id) {
    return {
      id: user.id,
      username: tournament.players.find(p => p.id === playerId)?.alias || user.username,
      avatar: `${BASE_URL}/user${user.avatar}` || '/images/default_avatar.png',
      status: 'playing'
    };
  }
  const participant = UserState.getAllUsers().find(p => p.id === playerId);
  if (!participant) {
    throw new Error(`Player with ID ${playerId} not found among friends or yourself`);
  }
  return {
    id: participant.id,
    username: tournament.players.find(p => p.id === playerId)?.alias || participant.username,
    avatar: `${BASE_URL}/user${participant.avatar_url || '/images/default_avatar.png'}`,
    status: 'playing'
  };
}



// Конвертирует матч в красивую структуру
export function mapTournamentMatchToDisplay(match: TournamentMatch): MatchPair {
  const player1 = getPlayerInfo(match.player1Id);
  const player2 = getPlayerInfo(match.player2Id);

  console.log("Mapped players", player1, player2);
  return {
    player1,
    player2,
    winner: match.winner
  };
}