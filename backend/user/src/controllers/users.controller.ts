import { FastifyReply, FastifyRequest } from "fastify";
import { registerUserService, updateAvatarService, updateUsernameService, getUserProfileService, getAllUsersService } from "../services/users.service";
import { getErrorMessage, getErrorStatusCode, logError, createValidationError, createAuthenticationError } from "../utils/errorHandler";
import { getUserById } from "../models/user.model";
import { getUserIdFromHeader } from "../utils/outils";
import { sendNotification } from "../server";


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
	  const response = await updateAvatarService(user.id, avatar);
	  return reply.status(200).send(response);
	} catch (error) {
	  logError(error, "updateProfile");
	  return reply.status(getErrorStatusCode(error)).send({ error: getErrorMessage(error) });
	}
  }


  export async function registerUserController(userId: number, username: string, email: string) {
	try {
		const response = await registerUserService(userId, username, email);
		console.log("User registered", response);
	} catch (error) {
		logError(error, "registerUser");
		throw createAuthenticationError("Error registering user");
	}
  }

  


export async function updateUsernameController(userId: number, username: string, email: string) {
	try {
	  const response = await updateUsernameService(userId, username , email);
	  console.log("Username updated", response);
	} catch (error) {
	  logError(error, "updateProfile");
	}
  }

  export async function getUserInfoController(req: FastifyRequest, reply: FastifyReply) {
	try {
		const userId = getUserIdFromHeader(req);
		const user = await getUserProfileService(userId);
		sendNotification(userId, { type: "profile-view", payload: { userId } });
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
	  const bearer = req.headers.authorization;
	  console.log("bearer", bearer);
	  const users = await getAllUsersService();
	  return users;
	} catch (error) {	
	  return reply.status(getErrorStatusCode(error)).send({ error: getErrorMessage(error) });
	}
  }