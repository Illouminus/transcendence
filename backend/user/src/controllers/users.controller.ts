import { FastifyReply, FastifyRequest } from "fastify";
import { updateUserService } from "../services/users.service";
import { getErrorMessage, getErrorStatusCode, logError, createValidationError, createAuthenticationError } from "../utils/errorHandler";
import { getUserByEmail } from "../models/user.model";


// Function for updating a user profile
// The same logic as in the registerUser function is used to process the multipart form data
// The verifyAuth function is used to check if the user is authenticated
// The updateUser function is used to update the user profile
// The updateUser function also validates the fields and uploads the avatar file
// The updateUser function returns the updated user profile
// The updateUser function is called with the user ID, username, email, password, and avatar file
// The updateUser function returns the updated user profile


interface UpdateProfileFileds {
	username: string;
	email: string;
	password?: string;
	avatar?: Buffer;
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