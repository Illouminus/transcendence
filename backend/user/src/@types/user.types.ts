import { FastifyMultipartOptions } from 'fastify-multipart';
import { FriendsList } from './friends.types';

export interface RegisterBody {
	username: string;
	email: string;
	password: string;
	avatarFile?: FastifyMultipartOptions;
}

export interface LoginBody {
	email: string;
	password: string;
}

export interface GoogleUser {
	name?: string;
	email?: string;
	picture?: string;
	sub: string;
}

export interface JwtPayload {
	userId: number;
	iat?: number;
	exp?: number;
}

export interface User {
	id: number;
	username: string;
	avatar_url: string | null;
	created_at: string;
	updated_at: string;
	wins: number;
	losses: number;
	email: string;
}

export interface Achievement {
	id: number;
	userId: number;
	achievement: string;
	dateEarned: string;
}

export interface CountRow {
	totalGames?: number;
	totalTournaments?: number;
	tournamentWins?: number;
}

export interface UserProfile extends User {
	achievements: Achievement[];
}

export interface PublicUserProfile {
	id: number;
	username: string;
	avatarUrl: string | null;
	wins: number;
	losses: number;
	achievements: Achievement[];
	email: string;
	friends: FriendsList[];
	incomingRequests: FriendsList[];
	outgoingRequests: FriendsList[];
}