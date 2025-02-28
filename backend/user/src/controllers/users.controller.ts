import { FastifyReply, FastifyRequest } from "fastify";
import { updateUserService } from "../services/users.service";
import { getErrorMessage, getErrorStatusCode, logError, createValidationError, createAuthenticationError } from "../utils/errorHandler";
import { getUserByEmail } from "../models/user.model";


interface UpdateProfileFileds {
	email: string;
	avatar?: Buffer;
}


export async function updateAvatarController(req: FastifyRequest<{Body: UpdateProfileFileds}>, reply: FastifyReply) {
	try {
	 const { email, avatar } = req.body;
	 if( !email) {
	   throw createValidationError("Email are required");
	 }
	  const user = await getUserByEmail(req.body.email);
	  if (!user) {
		return reply.status(401).send({ error: "Unauthorized" });
	  }
	  const response = await updateUserService(user.id, username, email, password || null, avatar);
	  return reply.status(200).send(response);
	} catch (error) {
	  logError(error, "updateProfile");
	  return reply.status(getErrorStatusCode(error)).send({ error: getErrorMessage(error) });
	}
  }


export async function updateProfile(req: FastifyRequest<{Body: UpdateProfileFileds}>, reply: FastifyReply) {
	try {
	 const { username, email, password, avatar } = req.body;
	 if(!username || !email) {
	   throw createValidationError("Username and email are required");
	 }
	  const user = await getUserByEmail(req.body.email);
	  if (!user) {
		return reply.status(401).send({ error: "Unauthorized" });
	  }
	  const response = await updateUserService(user.id, username, email, password || null, avatar);
	  return reply.status(200).send(response);
	} catch (error) {
	  logError(error, "updateProfile");
	  return reply.status(getErrorStatusCode(error)).send({ error: getErrorMessage(error) });
	}
  }