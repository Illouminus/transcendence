import { FastifyReply, FastifyRequest } from "fastify";
import { registerUserService, updateAvatarService, updateUsernameService, getUserProfileService, getAllUsersService, incrementWinsService } from "../services/users.service";
import { getErrorMessage, getErrorStatusCode, logError, createValidationError, createAuthenticationError } from "../utils/errorHandler";
import { getUserById } from "../models/user.model";
import { getUserIdFromHeader } from "../utils/outils";
import { sendNotification, sendNotificationToAll } from "../server";
import { publishToQueue } from "../rabbit/rabbit";


interface UpdateProfileFileds {
	userId: number;
	avatar?: Buffer;
}


export async function updateAvatarController(req: FastifyRequest<{Body: UpdateProfileFileds}>, reply: FastifyReply) {
	try {
	 const userId = getUserIdFromHeader(req);
	 const { avatar } = req.body;
	 
	  const user = await getUserById(userId);
	  if (!user) {
		return reply.status(401).send({ error: "User not found" });
	  }
	  const avatarUrl = await updateAvatarService(user.id, avatar);
	  if(avatarUrl)
	  	sendNotificationToAll({ type: "user_avatar_updated", payload: { userId: user.id, avatarUrl: avatarUrl } });
	  return reply.status(200).send({avatarUrl});
	} catch (error) {
	  logError(error, "updateProfile");
	  return reply.status(getErrorStatusCode(error)).send({ error: getErrorMessage(error) });
	}
  }


  export async function registerUserController(userId: number, username: string, email: string) {
	try {
		const response = await registerUserService(userId, username, email);
		console.log("User registered", response);
		if (!response) {
			throw createValidationError("User registration failed");
		}
		publishToQueue("user.registered", {
			userId: response.id,
			username: response.username,
			email : response.email,
		});
		sendNotificationToAll({ type: "user_registered", payload: { userId: response.id, username: response.username } });
	} catch (error) {
		logError(error, "registerUser");
		throw createAuthenticationError("Error registering user");
	}
  }

  


export async function updateUsernameController(userId: number, username: string, email: string) {
	try {
	  const response = await updateUsernameService(userId, username , email);
	} catch (error) {
	  logError(error, "updateProfile");
	}
  }

  export async function getUserInfoController(req: FastifyRequest, reply: FastifyReply) {
	try {
		const userId = getUserIdFromHeader(req);
		const user = await getUserProfileService(userId);
		
		if (!user) {
			return reply.status(401).send({ error: "User not found" });
		}
		return user;
	} catch (error) {
	  logError(error, "getUserInfo");
	  return reply.status(getErrorStatusCode(error)).send({ error: getErrorMessage(error) });
	}
  }



  export async function getAllUsersController(req: FastifyRequest, reply: FastifyReply) {
	try {
	  const users = await getAllUsersService();
	  return users;
	} catch (error) {	
	  return reply.status(getErrorStatusCode(error)).send({ error: getErrorMessage(error) });
	}
  }


export async function incrementWinsController(req: FastifyRequest, reply: FastifyReply) {
	try {
	  const { userId, type } = req.body as { userId: number; type: 'win' | 'loss' };
	  if (!userId || !type) {
		return reply.status(400).send({ error: 'Missing userId or type' });
	  }
  
	  await incrementWinsService(userId, type);
	  return { message: `${type} incremented successfully` };
	} catch (error) {
	  logError(error, "incrementWins");
	  return reply.status(getErrorStatusCode(error)).send({ error: getErrorMessage(error) });
	}
  }
  