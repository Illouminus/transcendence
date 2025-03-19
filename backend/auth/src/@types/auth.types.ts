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
	google_id: string | null;
	is_verified: boolean;
	two_factor_secret: string | null;
	two_factor_enabled: boolean;
	created_at: string;
	updated_at: string;
}

export interface LoginBody {
	email: string;
	password: string;
}

export interface RegisterUser {
	username: string;
	email: string;
	password: string;
}

export interface TwoFABody {
	email: string;
	code: string;
}

export interface UserPublic {
	id: number;
	is_verified: boolean;
	two_factor_enabled: boolean;
	email: string;
	is_google_auth: boolean;
}