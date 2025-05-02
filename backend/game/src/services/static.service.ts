import {
  getGameLosses,
  getGameWins,
  getTotalGamesPlayed,
  getTotalTournaments,
  getTournamentWins,
  getUserGames,
} from "../models/game.model";

export async function getUserGamesService(userId: number) {
  try {
    const games = await getUserGames(userId);
    return games;
  } catch (error) {
    throw new Error("Error retrieving user games");
  }
}

export async function getGameStatisticsByIdService(id: number) {
  try {
    const results = await Promise.all([
      getTotalGamesPlayed(id),
      getTotalTournaments(id),
      getTournamentWins(id),
      getGameWins(id),
      getGameLosses(id),
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
