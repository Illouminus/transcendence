import { FastifyReply, FastifyRequest } from "fastify";
import { registerUserService, updateUser } from "../services/users.service";
import { verifyAuth } from "../services/auth.service";
import { 
	getErrorMessage, 
	getErrorStatusCode, 
	logError, 
	createValidationError, 
	createAuthenticationError
  } from "../utils/errorHandler";
import * as fileService from "../services/file.service";


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
	console.log("[DEBUG] Starting registerUser");
	let partsTimeout: NodeJS.Timeout | null = null;
	
	try {
	  // Установка таймаута для обработки multipart-запроса
	  partsTimeout = setTimeout(() => {
		console.log("[DEBUG] Timeout triggered after 30 seconds");
		reply.status(408).send({ error: "Request timeout while processing file upload" });
	  }, 30000);
  
	  let avatarFile: any | null = null;
	  let username = "";
	  let email = "";
	  let password = "";
  
	  console.log("[DEBUG] Starting multipart parsing");
	  
	  // Подготовим запрос к парсингу
	  const parts = req.parts();
	  
	  // Ручная обработка multipart-данных
	  try {
		console.log("[DEBUG] Iterating through parts");
		
		for await (const part of parts) {
		  console.log(`[DEBUG] Processing part: ${part.type}, fieldname: ${part.fieldname}`);
		  
		  if (part.type === "file") {
			if (part.fieldname === "avatar") {
			  console.log("[DEBUG] Found avatar file");
			  
			  try {
				console.log("[DEBUG] Validating file");
				fileService.validateFile(part);
				avatarFile = part;
				console.log("[DEBUG] File validation successful");
			  } catch (error) {
				console.error("[DEBUG] File validation failed:", error);
				throw error;
			  }
			} else {
			  // Обязательно обработать файл, даже если он не нужен
			  console.log(`[DEBUG] Skipping file with fieldname: ${part.fieldname}`);
			  await part.file.resume(); // Пропускаем ненужный файл
			}
		  } else {
			const field = part;
			console.log(`[DEBUG] Processing field: ${field.fieldname}, value: ${String(field.value).substring(0, 10)}...`);
			
			if (field.fieldname === "username") {
			  username = String(field.value);
			} else if (field.fieldname === "email") {
			  email = String(field.value);
			} else if (field.fieldname === "password") {
			  password = String(field.value);
			  // Не логируем пароль полностью
			  console.log(`[DEBUG] Password received, length: ${password.length}`);
			}
		  }
		}
		
		console.log("[DEBUG] Finished parsing multipart data");
	  } catch (error) {
		console.error("[DEBUG] Error in multipart parsing:", error);
		clearTimeout(partsTimeout);
		throw error;
	  }
  
	  console.log("[DEBUG] Clearing timeout");
	  clearTimeout(partsTimeout);
  
	  console.log("[DEBUG] Validating required fields");
	  if (!username || !email || !password) {
		console.log("[DEBUG] Validation failed: missing required fields");
		throw createValidationError("All fields are required", {
		  username: Boolean(username),
		  email: Boolean(email),
		  password: Boolean(password)
		});
	  }
	  
	  console.log("[DEBUG] Calling registerUserService");
	  const response = await registerUserService(
		reply.server, 
		username, 
		email, 
		password, 
		avatarFile
	  );
	  
	  console.log("[DEBUG] Registration successful");
	  return reply.status(201).send(response);
	} catch (error) {
	  console.error("[DEBUG] Error in registerUser:", error);
	  
	  if (partsTimeout) {
		clearTimeout(partsTimeout);
	  }
	  
	  // Логируем ошибку
	  logError(error, 'registerUser');
	  
	  // Определяем статус-код и сообщение об ошибке
	  const statusCode = getErrorStatusCode(error);
	  const errorMessage = getErrorMessage(error);
	  
	  console.log(`[DEBUG] Sending error response: ${statusCode} - ${errorMessage}`);
	  return reply.status(statusCode).send({ error: errorMessage });
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
  export async function updateProfile(req: FastifyRequest, reply: FastifyReply) {
	// Установка таймаута для обработки multipart-запроса
	const partsTimeout = setTimeout(() => {
	  reply.status(408).send({ error: "Request timeout while processing file upload" });
	}, 30000);
  
	try {
	  let avatarFile: any | null = null;
	  let username = "";
	  let email = "";
	  let password = "";
  
	  // Parsing multipart data
	  try {
		for await (const part of req.parts()) {
		  if (part.type === "file") {
			if (part.fieldname === "avatar") {
			  fileService.validateFile(part);
			  avatarFile = part;
			}
		  } else {
			const field = part;
			if (field.fieldname === "username") {
			  username = String(field.value);
			} else if (field.fieldname === "email") {
			  email = String(field.value);
			} else if (field.fieldname === "password") {
			  password = String(field.value);
			}
		  }
		}
	  } catch (error) {
		clearTimeout(partsTimeout);
		throw error;
	  }
  
	  clearTimeout(partsTimeout);
  
	  // Verify the user is authenticated
	  const user = await verifyAuth(req.server, req);
	  if (!user) {
		throw createAuthenticationError("Unauthorized");
	  }
  
	  // Update the user profile in the service
	  const response = await updateUser(
		req.server,
		user.id,
		username,
		email,
		password || null,
		avatarFile
	  );
  
	  return reply.status(200).send(response);
	} catch (error) {
	  clearTimeout(partsTimeout);
	  
	  // Log the error
	  logError(error, 'updateProfile');
	  
	  // Determine the status code and error message
	  const statusCode = getErrorStatusCode(error);
	  const errorMessage = getErrorMessage(error);
	  
	  return reply.status(statusCode).send({ error: errorMessage });
	}
  }

