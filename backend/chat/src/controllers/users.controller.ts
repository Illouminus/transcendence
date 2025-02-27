import { FastifyReply, FastifyRequest } from "fastify";
import { registerUserService, updateUserService } from "../services/users.service";
import { verifyAuth } from "../services/auth.service";
import { 
	getErrorMessage, 
	getErrorStatusCode, 
	logError, 
	createValidationError, 
	createAuthenticationError
  } from "../utils/errorHandler";
import * as fileService from "../services/file.service";
import { pipeline } from "stream";
import fs from "fs";


// Function for registering a new user
// The wait for the parts() function is necessary to process the multipart form data
// The parts() function is an async generator that yields the parts of the multipart form data
// The for await loop is used to iterate over the parts of the multipart form data
// The part.type property is used to check if the part is a file or a field
// The part.fieldname property is used to get the name of the field
// The part.value property is used to get the value of the field
// The part.mimetype property is used to get the MIME type of the file
// The part.file property is used to get the file stream
export async function registerUser(req: FastifyRequest, reply: FastifyReply) {
	try {
	  // Текстовые поля доступны как строки благодаря attachFieldsToBody: 'keyValues'
	  const { username, email, password } = req.body as {
		username: string;
		email: string;
		password: string;
	  };
	  // Получаем файл, если он есть
	  const file = await req.file();
	  let avatarFile = file && file.fieldname === "avatar" ? file : undefined;
	  const response = await registerUserService(req.server, username, email, password, avatarFile);
	  return reply.status(201).send(response);
	} catch (error) {
	  logError(error, "registerUser");
	  return reply.status(getErrorStatusCode(error)).send({ error: getErrorMessage(error) });
	}
  }


// Function for updating a user profile
// The same logic as in the registerUser function is used to process the multipart form data
// The verifyAuth function is used to check if the user is authenticated
// The updateUser function is used to update the user profile
// The updateUser function also validates the fields and uploads the avatar file
// The updateUser function returns the updated user profile
// The updateUser function is called with the user ID, username, email, password, and avatar file
// The updateUser function returns the updated user profile


interface UpdateProfileFileds {
	username?: string;
	email?: string;
	password?: string;
	avatar?: Buffer;
}
export async function updateProfile(req: FastifyRequest, reply: FastifyReply) {
	try {
	  // Проверка аутентификации; verifyAuth возвращает профиль пользователя
	  const user = await verifyAuth(req.server, req);
	  if (!user) {
		return reply.status(401).send({ error: "Unauthorized" });
	  }
	  const { username, email, password, avatar } = req.body as UpdateProfileFileds;
	  //const file = await req.file();
	 // let avatarFile = file && file.fieldname === "avatar" ? file : undefined;
	  console.log("avatarFile", avatar);
	  const response = await updateUserService(req.server, user.id, username, email, password || null, avatar);
	  return reply.status(200).send(response);
	} catch (error) {
	  logError(error, "updateProfile");
	  return reply.status(getErrorStatusCode(error)).send({ error: getErrorMessage(error) });
	}
  }