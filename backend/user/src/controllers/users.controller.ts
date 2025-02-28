import { FastifyReply, FastifyRequest } from "fastify";
import { registerUserService, updateAvatarService } from "../services/users.service";
import { getErrorMessage, getErrorStatusCode, logError, createValidationError, createAuthenticationError } from "../utils/errorHandler";
import { getUserById } from "../models/user.model";


interface UpdateProfileFileds {
	userId: number;
	avatar?: Buffer;
}


export async function updateAvatarController(req: FastifyRequest<{Body: UpdateProfileFileds}>, reply: FastifyReply) {
	try {
	 const { userId, avatar } = req.body;
	 if( !userId) {
	   throw createValidationError("UserId are required");
	 }
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


  export async function registerUserController(userId: number, username: string) {
	try {
		const response = await registerUserService(userId, username);
		console.log("User registered", response);
		return response;
	} catch (error) {
		logError(error, "registerUser");
		throw createAuthenticationError("Error registering user");
	}
  }

// export async function updateProfile(req: FastifyRequest<{Body: UpdateProfileFileds}>, reply: FastifyReply) {
// 	try {
// 	 const { username, email, password, avatar } = req.body;
// 	 if(!username || !email) {
// 	   throw createValidationError("Username and email are required");
// 	 }
// 	  const user = await getUserByEmail(req.body.email);
// 	  if (!user) {
// 		return reply.status(401).send({ error: "Unauthorized" });
// 	  }
// 	  const response = await updateUserService(user.id, username, email, password || null, avatar);
// 	  return reply.status(200).send(response);
// 	} catch (error) {
// 	  logError(error, "updateProfile");
// 	  return reply.status(getErrorStatusCode(error)).send({ error: getErrorMessage(error) });
// 	}
//   }