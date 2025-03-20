import { getTotalGamesPlayed, getTotalTournaments, getTournamentWins } from "../models/game.model";




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


export async function updateGameStatisticsService(id: number) {
	try {
		
	} catch (error) {
		
	}
}