import { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import {
	createUser,
	getUserById,
	getTotalGamesPlayed, getTotalTournaments,
	getTournamentWins, getUserAchievements
} from "../models/user.model";

import { UserProfile, PublicUserProfile } from "../@types/auth.types";
import path from "path";
import fs from "fs";
import db from "../database";


export async function getUserProfile(userId: number): Promise<PublicUserProfile> {

	const user = await getUserById(userId);
	if (!user) {
		throw new Error("User not found");
	}

	const totalGames = await getTotalGamesPlayed(userId);
	const totalTournaments = await getTotalTournaments(userId);
	const tournamentWins = await getTournamentWins(userId);
	const achievements = await getUserAchievements(userId);

	const fullProfile: UserProfile = {
		...user,
		totalGames,
		totalTournaments,
		tournamentWins,
		achievements,
	};

	const publicProfile: PublicUserProfile = {
		id: fullProfile.id,
		username: fullProfile.username,
		email: fullProfile.email,
		avatarUrl: fullProfile.avatar_url,
		isVerified: fullProfile.is_verified,
		wins: fullProfile.wins,
		losses: fullProfile.losses,
		totalGames: fullProfile.totalGames,
		totalTournaments: fullProfile.totalTournaments,
		tournamentWins: fullProfile.tournamentWins,
		achievements: fullProfile.achievements,
	};

	return publicProfile;
}


export async function registerUserService(
	fastify: FastifyInstance,
	username: string,
	email: string,
	password: string,
	avatarFile?: any
): Promise<{ message: string; userId: number }> {
	if (!username || !email || !password) {
		throw new Error("All fields are required");
	}
	const hashedPassword = await bcrypt.hash(password, 10);

	let avatar_url: string | null = null;

	if (avatarFile) {
		const uploadsDir = path.join(__dirname, "../../public/images");
		if (!fs.existsSync(uploadsDir)) {
			fs.mkdirSync(uploadsDir, { recursive: true });
		}

		const filename = Date.now() + "-" + avatarFile.filename;
		const filePath = path.join(uploadsDir, filename);

		await new Promise<void>((resolve, reject) => {
			const writeStream = fs.createWriteStream(filePath);
			avatarFile.file.pipe(writeStream);
			writeStream.on("finish", resolve);
			writeStream.on("error", reject);
		});

		avatar_url = `/images/${filename}`;
	}

	const userId = await createUser(username, email, hashedPassword, avatar_url);
	return { message: "User registered!", userId };
}


export async function updateUser(
	fastify: FastifyInstance,
	userId: number,
	username: string,
	email: string,
	password?: string,
	avatarFile?: any
): Promise<{ message: string; userId: number }> {
	if (!username || !email) {
		throw new Error("Username and email are required");
	}

	console.log("HELLO");

	let hashedPassword: string | null = null;
	if (password) {
		hashedPassword = await bcrypt.hash(password, 10);
	}

	let avatar_url: string | null = null;
	if (avatarFile) {
		const imagesDir = path.join(__dirname, "../../public/images");
		if (!fs.existsSync(imagesDir)) {
			fs.mkdirSync(imagesDir, { recursive: true });
		}

		const filename = Date.now() + "-" + avatarFile.filename;
		const filePath = path.join(imagesDir, filename);

		await new Promise<void>((resolve, reject) => {
			const writeStream = fs.createWriteStream(filePath);
			avatarFile.file.pipe(writeStream);
			writeStream.on("finish", resolve);
			writeStream.on("error", reject);
		});

		avatar_url = `/images/${filename}`;
	}

	return new Promise((resolve, reject) => {
		let query = "";
		let params: any[] = [];

		if (hashedPassword) {
			query = "UPDATE users SET username = ?, email = ?, password_hash = ?, avatar_url = ? WHERE id = ?";
			params = [username, email, hashedPassword, avatar_url, userId];
		} else {
			query = "UPDATE users SET username = ?, email = ?, avatar_url = ? WHERE id = ?";
			params = [username, email, avatar_url, userId];
		}
		db.run(query, params, function (this: { changes: number }, err: Error | null) {
			if (err) {
				reject(err);
			} else {
				resolve({ message: "User updated!", userId });
			}
		});
	});
}