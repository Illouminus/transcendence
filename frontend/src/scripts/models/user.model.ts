export interface Achievement {
	id: number;
	userId: number;
	achievement: string;
	dateEarned: string;
}

export interface User {
	id: number;
	username: string;
	email: string;
	avatar?: string;
	googleId?: string;
	is_verified: boolean;
	two_factor_enabled?: boolean;
	createdAt: string;
	updatedAt: string;
	wins: number;
	losses: number;
	totalGames?: number;
	totalTournaments?: number;
	tournamentWins?: number;
	achievements?: Achievement[];
}
