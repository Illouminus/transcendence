export interface JwtPayload {
	userId: number;
	iat?: number;
	exp?: number;
}


export interface CountRow {
	totalGames?: number;
	totalTournaments?: number;
	tournamentWins?: number;
	totalWins?: number;
	totalLosses?: number;
}
