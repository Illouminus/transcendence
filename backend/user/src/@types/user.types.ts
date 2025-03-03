import { FastifyMultipartOptions } from 'fastify-multipart';

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
	email: string;
	password_hash: string | null;
	avatar_url: string | null;
	google_id: string | null;
	is_verified: boolean;
	two_factor_secret: string | null;
	created_at: string;
	updated_at: string;
	wins: number;
	losses: number;
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

	achievements: Achievement[];
}