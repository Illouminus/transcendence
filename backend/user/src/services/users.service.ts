import { createUser, getUserById, getUserAchievements,updateAvatar, getAllUsers, updateUserData, incrementWins, incrementLosses } from "../models/user.model";
import { UserProfile, PublicUserProfile, User } from "../@types/user.types";
import * as fileService from "./file.service";
import { createNotFoundError,createValidationError,createDatabaseError,logError } from "../utils/errorHandler";
import { getFriendsListFromDB, getIncomingRequestsDb, getOutgoingRequestsDb } from "../models/friends.model";


export async function getUserProfileService(userId: number): Promise<PublicUserProfile> {
	try {
	  const user = await getUserById(userId);
	  if (!user) {
		throw createNotFoundError("User");
	  }
	  const  achievements = await getUserAchievements(userId);
	  const outcomingRequests = await getOutgoingRequestsDb(userId);
	  const incomingRequests = await getIncomingRequestsDb(userId);
	  const friends = await getFriendsListFromDB(userId);
  
	  const fullProfile: UserProfile = { ...user, achievements };
  
	  const publicProfile: PublicUserProfile = {
		id: fullProfile.id,
		username: fullProfile.username,
		avatarUrl: fullProfile.avatar_url,
		wins: fullProfile.wins,
		losses: fullProfile.losses,
		achievements: fullProfile.achievements,
		email: fullProfile.email,
		friends: friends,
		incomingRequests: incomingRequests,
		outgoingRequests: outcomingRequests,
	  };
  
	  return publicProfile;
	} catch (error) {
	  if (error && typeof error === 'object' && 'type' in error) {
		throw error;
	  }
	  logError(error, 'getUserProfile');
	  throw createDatabaseError('Failed to get user profile', { userId });
	}
  }

  

  export async function registerUserService( userId: number, username: string, email: string): Promise<{ message: string }> {
	try {
	  if (!username || !email) {
		throw createValidationError("All fields are required", {
		  username: Boolean(username),
		});
	  }
	  const avatar_url = "/images/default_avatar.jpg";
	  await createUser(userId,username, avatar_url, email);
	  return { message: "User registered!" };
	} catch (error) {
	  logError(error, "registerUserService");
	  throw createDatabaseError("Failed to register user", {
		username,
		error: error instanceof Error ? error.message : "Unknown error",
	  });
	}
  }


  // Function to update user
  export async function updateAvatarService( userId: number, avatarFile?: any): Promise<{ message: string }> {
	try {
	  const currentUser = await getUserById(userId);
	  if (!currentUser) {
		throw createNotFoundError("User");
	  }

	  let avatar_url: string | null = currentUser.avatar_url;
	  if (avatarFile) {
		const fileResult = await fileService.saveFileBuffer(avatarFile, "avatar.jpg");
		if (currentUser.avatar_url || currentUser.avatar_url !== "/images/default_avatar.jpg") {
		  try {
			await fileService.deleteFile(currentUser.avatar_url!);
		  } catch (err) {
			logError(err, "updateUserService.deleteOldFile");
		  }
		}
		avatar_url = fileResult.url;
	  }
	  await updateAvatar(userId, avatar_url);
	  return { message: "User updated!" };
	} catch (error) {
	  logError(error, "updateUserService");
	  throw createDatabaseError("Failed to update user", {
		userId,
		error: error instanceof Error ? error.message : "Unknown error",
	  });
	}
  }


  export async function updateUsernameService( userId: number, username: string, email: string): Promise<void> {
	try {
		const response = await updateUserData(userId, {username, email});
		console.log("Username updated", response);
	} catch (error) {
		logError(error, "updateProfile");
	}
	}




  export async function getAllUsersService(): Promise<Array<User>> {
	try {
	  const users = await getAllUsers();
	  return users;
	} catch (error) {	
	  logError(error, "getAllUsersService");
	  throw createDatabaseError("Failed to get all users", {
		error: error instanceof Error ? error.message : "Unknown error",
	  });
	}
  }

  export async function incrementWinsService(userId: number, type: 'win' | 'loss'): Promise<void> {
	try {
	  if (type === 'win') {
		await incrementWins(userId);
	  } else if (type === 'loss') {
		await incrementLosses(userId);
	  }
	} catch (error) {
	  logError(error, "incrementWinsService");
	  throw createDatabaseError(`Failed to increment ${type}`, {
		userId,
		error: error instanceof Error ? error.message : "Unknown error",
	  });
	}
  }
  