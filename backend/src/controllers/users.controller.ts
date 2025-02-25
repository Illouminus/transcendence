import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { registerUserService, updateUser } from "../services/users.service";
import { getErrorMessage } from "../utils/errorHandler";
import { verifyAuth } from "../services/auth.service";
import { LoginBody } from "../@types/auth.types";

function isValidImageType(mimetype: string): boolean {
	const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
	return validImageTypes.includes(mimetype);
  }



export async function registerUser(req: FastifyRequest, reply: FastifyReply) {
	try {
		let avatarFile: any | null = null;
		let username = "";
		let email = "";
		let password = "";

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

		console.log("Registering user with username:", username, "email:", email, "password:", password);
		if (!username || !email || !password) {
			return reply.status(400).send({ error: "Username, email and password are required" });
		}

		const response = await registerUserService(reply.server, username, email, password, avatarFile);
		return reply.status(201).send(response);
	} catch (error) {
		return reply.status(400).send({ error: getErrorMessage(error) });
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