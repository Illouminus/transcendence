export interface Achievement {
	id: number;
	userId: number;
	achievement: string;
	dateEarned: string;
}

interface FriendsList {
	id: number;
	username: string;
	avatar: string;
	status: string;
  }
  
export interface User {
	id: number;
	username: string;
	email: string;
	avatar?: string;
	is_verified: boolean;
	is_google_auth: boolean;
	two_factor_enabled?: boolean;
	createdAt: string;
	updatedAt: string;
	wins: number;
	losses: number;
	friends: FriendsList[];
	incomingRequests: FriendsList[];
	outgoingRequests: FriendsList[];
	// totalGames?: number;
	// totalTournaments?: number;
	// tournamentWins?: number;
	achievements?: Achievement[];
}
