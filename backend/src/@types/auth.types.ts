export interface RegisterBody {
	username: string;
	email: string;
	password: string;
}

export interface LoginBody {
	email: string;
	password: string;
}

export interface GoogleUser {
	name?: string,
	email?: string,
	picture?: string,
	sub: string
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
	created_at: string; // `DATETIME` в SQL обычно представляется как `string`
	updated_at: string; // `DATETIME`
	wins: number;
	losses: number;
}