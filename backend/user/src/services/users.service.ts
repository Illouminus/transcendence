import { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import {
  createUser,
  getUserById,
  getTotalGamesPlayed,
  getTotalTournaments,
  getTournamentWins,
  getUserAchievements,
  updateUserData
} from "../models/user.model";
import { UserProfile, PublicUserProfile } from "../@types/user.types";
import * as fileService from "./file.service";
import {
  createNotFoundError,
  createValidationError,
  createDatabaseError,
  logError
} from "../utils/errorHandler";
import path from "path";
import fs from "fs";
import { pipeline } from "stream";


  

// Function to get user profile
export async function getUserProfile(userId: number): Promise<PublicUserProfile> {
	try {
	  const user = await getUserById(userId);
	  if (!user) {
		throw createNotFoundError("User");
	  }
  
	  // Get all user stats in parallel from different tables
	  const [totalGames, totalTournaments, tournamentWins, achievements] = await Promise.all([
		getTotalGamesPlayed(userId),
		getTotalTournaments(userId),
		getTournamentWins(userId),
		getUserAchievements(userId)
	  ]);
  
	  // Form full profile
	  const fullProfile: UserProfile = {
		...user,
		totalGames,
		totalTournaments,
		tournamentWins,
		achievements,
	  };
  
	  // Transform to public profile
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
	} catch (error) {
	  // If error is already a custom error, throw it
	  if (error && typeof error === 'object' && 'type' in error) {
		throw error;
	  }
	  
	  // Else log and throw generic error
	  logError(error, 'getUserProfile');
	  throw createDatabaseError('Failed to get user profile', { userId });
	}
  }

  export async function registerUserService(
	fastify: FastifyInstance,
	username: string,
	email: string,
	password: string,
	avatarFile?: any
  ): Promise<{ message: string; userId: number }> {
	try {
	  if (!username || !email || !password) {
		throw createValidationError("All fields are required", {
		  username: Boolean(username),
		  email: Boolean(email),
		  password: Boolean(password),
		});
	  }
	  const hashedPassword = await bcrypt.hash(password, 10);
	  let avatar_url: string | null = null;
	  if (avatarFile) {
		fileService.validateFile(avatarFile);
		const fileResult = await fileService.saveFile(avatarFile);
		avatar_url = fileResult.url;
	  }
	  const userId = await createUser(username, email, hashedPassword, avatar_url);
	  return { message: "User registered!", userId };
	} catch (error) {
	  logError(error, "registerUserService");
	  throw createDatabaseError("Failed to register user", {
		username,
		email,
		error: error instanceof Error ? error.message : "Unknown error",
	  });
	}
  }


  // Function to update user
  export async function updateUserService( userId: number, username?: string, email?: string, password?: string | null, avatarFile?: any): Promise<{ message: string; userId: number }> {
	try {
	  const currentUser = await getUserById(userId);
	  if (!currentUser) {
		throw createNotFoundError("User");
	  }
	  let hashedPassword: string | null = null;
	  if (password && password.trim() !== "") {
		hashedPassword = await bcrypt.hash(password, 10);
	  }
	  let avatar_url: string | null = currentUser.avatar_url;
	  if (avatarFile) {
		const fileResult = await fileService.saveFileBuffer(avatarFile, "avatar.jpg");
		if (currentUser.avatar_url) {
		  try {
			await fileService.deleteFile(currentUser.avatar_url);
		  } catch (err) {
			logError(err, "updateUserService.deleteOldFile");
		  }
		}
		avatar_url = fileResult.url;
	  }
	  await updateUserData(userId, {
		username,
		email,
		password_hash: hashedPassword,
		avatar_url,
	  });
	  return { message: "User updated!", userId };
	} catch (error) {
	  logError(error, "updateUserService");
	  throw createDatabaseError("Failed to update user", {
		userId,
		username,
		email,
		error: error instanceof Error ? error.message : "Unknown error",
	  });
	}
  }