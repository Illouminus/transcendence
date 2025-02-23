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
	avatarUrl?: string;
	googleId?: string;
	isVerified: boolean;
	twoFactorSecret?: string;
	createdAt: string;
	updatedAt: string;
	wins: number;
	losses: number;
	totalGames?: number;
	totalTournaments?: number;
	tournamentWins?: number;
	achievements?: Achievement[];
}


export const UserState = {

	user: null as User | null,
	setUser: (user: User) => {
		UserState.user = user;
	},
	getUser: () => {
		return UserState.user;
	},
	isLoggedIn: () => {
		return UserState.user !== null;
	},
	logout: () => {
		UserState.user = null;
	}
};
