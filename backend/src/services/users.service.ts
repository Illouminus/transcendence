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
import { UserProfile, PublicUserProfile } from "../@types/auth.types";
import * as fileService from "./file.service";
import {
  createNotFoundError,
  createValidationError,
  createDatabaseError,
  logError
} from "../utils/errorHandler";



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
	  // Validate input
	  if (!username || !email || !password) {
		throw createValidationError("All fields are required", { 
		  username: Boolean(username), 
		  email: Boolean(email), 
		  password: Boolean(password) 
		});
	  }
	  
	  const hashedPassword = await bcrypt.hash(password, 10);
	  
	  // If avatar file is provided, validate and save it
	  let avatar_url: string | null = null;
	  if (avatarFile) {
		try {
		  // Validate and save file
		  fileService.validateFile(avatarFile);
		  const fileResult = await fileService.saveFile(avatarFile);
		  avatar_url = fileResult.url;
		} catch (error) {
		  throw error;
		}
	  }
	  
	  // Create user
	  const userId = await createUser(username, email, hashedPassword, avatar_url);
	  return { message: "User registered!", userId };
	} catch (error) {
	  // If error is already a custom error, throw it
	  if (error && typeof error === 'object' && 'type' in error) {
		throw error;
	  }
	  
	  // Else log and throw generic error
	  logError(error, 'registerUserService');
	  throw createDatabaseError('Failed to register user', { 
		username, 
		email,
		error: error instanceof Error ? error.message : 'Unknown error'
	  });
	}
  }


  // Function to update user
  export async function updateUser(
	fastify: FastifyInstance,
	userId: number,
	username: string,
	email: string,
	password: string | null,
	avatarFile?: any
  ): Promise<{ message: string; userId: number }> {
	try {
	  // Validate input
	  if (!username || !email) {
		throw createValidationError("Username and email are required", {
		  username: Boolean(username),
		  email: Boolean(email)
		});
	  }
  
	  // Get current user data
	  const currentUser = await getUserById(userId);
	  if (!currentUser) {
		throw createNotFoundError("User");
	  }
  
	  // If password is provided, hash it
	  let hashedPassword: string | null = null;
	  if (password && password.trim()) {
		hashedPassword = await bcrypt.hash(password, 10);
	  }
  
	  // ОIf avatar file is provided, validate and save it
	  let avatar_url: string | null = currentUser.avatar_url;
	  if (avatarFile) {
		try {
		  // Validate and save file
		  fileService.validateFile(avatarFile);
		  const fileResult = await fileService.saveFile(avatarFile);
		  
		  // Remove old avatar if it exists
		  if (currentUser.avatar_url) {
			await fileService.deleteFile(currentUser.avatar_url);
		  }
		  
		  avatar_url = fileResult.url;
		} catch (error) {
		  throw error;
		}
	  }
  
	  await updateUserData(userId, {
		username,
		email,
		password_hash: hashedPassword,
		avatar_url
	  });
	  
	  return { message: "User updated!", userId };
	} catch (error) {
	  // If error is already a custom error, throw it
	  if (error && typeof error === 'object' && 'type' in error) {
		throw error;
	  }
	  
	  // Else log and throw generic error
	  logError(error, 'updateUser');
	  throw createDatabaseError('Failed to update user', { 
		userId, 
		username, 
		email,
		error: error instanceof Error ? error.message : 'Unknown error'
	  });
	}
  }