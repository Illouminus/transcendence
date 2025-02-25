import { FastifyReply, FastifyRequest } from "fastify";
import { registerUserService, updateUser } from "../services/users.service";
import { getErrorMessage } from "../utils/errorHandler";
import { verifyAuth } from "../services/auth.service";
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
	// Install a timeout for processing multipart requests to prevent abuse
	const partsTimeout = setTimeout(() => {
	  reply.status(408).send({ error: "Request timeout while processing file upload" });
	}, 30000);
  
	try {
	  let avatarFile: any | null = null;
	  let username = "";
	  let email = "";
	  let password = "";
  
	  // Iterate over the parts of the multipart form data
	  for await (const part of req.parts()) {
		if (part.type === "file") {
		  if (part.fieldname === "avatar") {
			try {
			  fileService.validateFile(part);
			  avatarFile = part;
			} catch (error) {
			  clearTimeout(partsTimeout);
			  return reply.status(400).send({ 
				error: error instanceof Error ? error.message : "Invalid file" 
			  });
			}
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
  
	  clearTimeout(partsTimeout);
  
	  // Валидация обязательных полей
	  if (!username || !email || !password) {
		return reply.status(400).send({ 
		  error: "Username, email, and password are required" 
		});
	  }
  
	  // Регистрация пользователя
	  const response = await registerUserService(
		reply.server, 
		username, 
		email, 
		password, 
		avatarFile
	  );
	  
	  return reply.status(201).send(response);
	} catch (error) {
	  clearTimeout(partsTimeout);
	  const errorMessage = getErrorMessage(error);
	  console.error("Registration error:", errorMessage);
	  return reply.status(400).send({ error: errorMessage });
	}
  }


export async function updateProfile(req: FastifyRequest, reply: FastifyReply) {
	try {
	  let avatarFile: any | null = null;
	  let username = "";
	  let email = "";
	  let password = "";
  
	  // Устанавливаем таймаут для обработки multipart-запроса
	  const partsTimeout = setTimeout(() => {
		reply.status(408).send({ error: "Request timeout while processing file upload" });
	  }, 30000); // 30 секунд таймаут
	  
	  try {
		for await (const part of req.parts()) {
		  if (part.type === "file") {
			if (!isValidImageType(part.mimetype)) {
				throw new Error("Invalid file type. Only JPEG, PNG, GIF and WebP images are allowed.");
			  }
			if (part.fieldname === "avatar") {
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
		
		clearTimeout(partsTimeout);
	  } catch (err) {
		clearTimeout(partsTimeout);
		console.error("Error processing multipart data:", err);
		return reply.status(400).send({ error: "Failed to process form data" });
	  }
  
	  const user = await verifyAuth(req.server, req);
	  if (!user) {
		return reply.status(401).send({ error: "Unauthorized" });
	  }
	  const userId = user.id;
  
	  console.log("Updating user with id:", userId, "username:", username, "email:", email, "password length:", password ? password.length : 0);
  
	  const response = await updateUser(req.server, userId, username, email, password, avatarFile);
	  return reply.status(200).send(response);
	} catch (error) {
	  return reply.status(400).send({ error: getErrorMessage(error) });
	}
  }