export interface JwtPayload {
	content: string;
	userId: number;
	iat?: number;
	exp?: number;
}