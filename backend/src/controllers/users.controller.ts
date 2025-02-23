import { FastifyRequest, FastifyReply } from "fastify";
import { registerUserService, updateUser } from "../services/users.service";
import { getErrorMessage } from "../utils/errorHandler";


export async function registerUser(req: FastifyRequest, reply: FastifyReply) {
	try {
		let avatarFile: any | null = null;
		let username = "";
		let email = "";
		let password = "";

		for await (const part of req.parts()) {
			if (part.type === "file") {
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

		for await (const part of req.parts()) {
			if (part.type === "file") {
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

		const userIdStr = req.headers["x-user-id"] as string;
		if (!userIdStr) {
			return reply.status(400).send({ error: "User ID is required" });
		}
		const userId = parseInt(userIdStr, 10);

		console.log("Updating user with id:", userId, "username:", username, "email:", email, "password:", password);

		const response = await updateUser(req.server, userId, username, email, password, avatarFile);
		return reply.status(200).send(response);
	} catch (error) {
		return reply.status(400).send({ error: getErrorMessage(error) });
	}
}