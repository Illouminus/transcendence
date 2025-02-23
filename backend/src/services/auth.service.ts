import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import {
	getUserByEmail, createUser, getUserByGoogleId,
	getUserById, createGooleUser, deleteSession,
	getTotalGamesPlayed, getTotalTournaments,
	getTournamentWins, getUserAchievements
} from "../models/user.model";
import { save2FACode, verify2FACode, updateJWT } from "../models/session.model";
import { sendEmail } from "./mailer.services";
import { GoogleUser, User, JwtPayload, UserProfile, PublicUserProfile } from "../@types/auth.types";
import path from "path";
import fs from "fs";
import { getUserProfile } from "./users.service";


export async function issueAndSetToken(fastify: FastifyInstance, res: FastifyReply, userId: number): Promise<string> {
	const token = fastify.jwt.sign({ userId }, { expiresIn: "1h" });
	await updateJWT(userId, token);
	res.setCookie("token", token, {
		httpOnly: true,
		secure: true,
		sameSite: "none",
		path: "/"
	});
	return token;
}




// export async function getUserProfile(userId: number): Promise<PublicUserProfile> {

// 	const user = await getUserById(userId);
// 	if (!user) {
// 		throw new Error("User not found");
// 	}

// 	const totalGames = await getTotalGamesPlayed(userId);
// 	const totalTournaments = await getTotalTournaments(userId);
// 	const tournamentWins = await getTournamentWins(userId);
// 	const achievements = await getUserAchievements(userId);

// 	const fullProfile: UserProfile = {
// 		...user,
// 		totalGames,
// 		totalTournaments,
// 		tournamentWins,
// 		achievements,
// 	};

// 	const publicProfile: PublicUserProfile = {
// 		id: fullProfile.id,
// 		username: fullProfile.username,
// 		email: fullProfile.email,
// 		avatarUrl: fullProfile.avatar_url,
// 		isVerified: fullProfile.is_verified,
// 		wins: fullProfile.wins,
// 		losses: fullProfile.losses,
// 		totalGames: fullProfile.totalGames,
// 		totalTournaments: fullProfile.totalTournaments,
// 		tournamentWins: fullProfile.tournamentWins,
// 		achievements: fullProfile.achievements,
// 	};

// 	return publicProfile;
// }


export async function verifyAuth(fastify: FastifyInstance, req: FastifyRequest): Promise<{ id: number; email: string; username: string } | null> {
	try {
		const token = req.cookies.token;
		if (!token) {
			return null;
		}

		let decoded: JwtPayload;
		try {
			decoded = fastify.jwt.verify(token);
		} catch (err) {
			return null;
		}
		if (!decoded || typeof decoded !== "object" || !decoded.userId) {
			return null;
		}
		const userProfile = await getUserProfile(decoded.userId);
		if (!userProfile) {
			return null;
		}
		return userProfile;
	} catch (error) {
		return null;
	}
}



// export async function registerUser(
// 	fastify: FastifyInstance,
// 	username: string,
// 	email: string,
// 	password: string,
// 	avatarFile?: any
// ): Promise<{ message: string; userId: number }> {
// 	if (!username || !email || !password) {
// 		throw new Error("All fields are required");
// 	}
// 	const hashedPassword = await bcrypt.hash(password, 10);

// 	let avatar_url: string | null = null;

// 	if (avatarFile) {
// 		const uploadsDir = path.join(__dirname, "../../public/images");
// 		if (!fs.existsSync(uploadsDir)) {
// 			fs.mkdirSync(uploadsDir, { recursive: true });
// 		}

// 		const filename = Date.now() + "-" + avatarFile.filename;
// 		const filePath = path.join(uploadsDir, filename);

// 		await new Promise<void>((resolve, reject) => {
// 			const writeStream = fs.createWriteStream(filePath);
// 			avatarFile.file.pipe(writeStream);
// 			writeStream.on("finish", resolve);
// 			writeStream.on("error", reject);
// 		});

// 		avatar_url = `/images/${filename}`;
// 	}

// 	const userId = await createUser(username, email, hashedPassword, avatar_url);
// 	return { message: "User registered!", userId };
// }

export async function loginUser(
	fastify: FastifyInstance,
	email: string,
	password: string,
) {
	const user = await getUserByEmail(email);
	if (!user || !user.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
		throw new Error("Invalid credentials");
	}

	const twoFactorCode = crypto.randomInt(100000, 999999).toString();
	const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

	await save2FACode(user.id, twoFactorCode, expiresAt);
	if (!sendEmail(email, "2FA Code", `Your 2FA code is: ${twoFactorCode}`)) {
		throw new Error("Failed to send 2FA code");
	}
	return { message: "2FA code sent to email" };
}

export async function verifyTwoFactorAuth(
	fastify: FastifyInstance,
	email: string,
	code: string,
): Promise<number> {
	const user = await getUserByEmail(email);
	if (!user) {
		throw new Error("Invalid credentials");
	}

	const session = await verify2FACode(user.id, code);
	if (!session) {
		throw new Error("Invalid 2FA code");
	}

	return user.id
}


export async function googleAuthenticator(idToken: string): Promise<User> {
	const googleClientId = process.env.GOOGLE_CLIENT_ID;
	const client = new OAuth2Client(googleClientId);

	const ticket = await client.verifyIdToken({
		idToken,
		audience: googleClientId,
	});
	const payload = ticket.getPayload();
	if (!payload) {
		throw new Error("Invalid google token");
	}

	const { name, email, picture, sub } = payload as GoogleUser;
	let user = await getUserByGoogleId(sub);
	if (!user) {
		const userId = await createGooleUser({ name, email, picture, sub });
		user = await getUserById(userId);
		if (!user) {
			throw new Error("User creation failed");
		}
	}
	return user;
}


export async function logoutUser(
	fastify: FastifyInstance,
	req: FastifyRequest,
	res: FastifyReply
): Promise<void> {
	const user = await verifyAuth(fastify, req);
	if (!user) {
		throw new Error("Unauthorized");
	}

	await deleteSession(user.id);

	res.clearCookie("token", {
		path: "/",
		httpOnly: true,
		secure: true,
		sameSite: "none",
	});
}