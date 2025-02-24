import { FastifyRequest, FastifyReply } from "fastify";
import {
	loginUser,
	verifyTwoFactorAuth,
	googleAuthenticator,
	verifyAuth,
	logoutUser
} from "../services/auth.service";
import { LoginBody } from "../@types/auth.types";
import { getErrorMessage } from "../utils/errorHandler";
import { issueAndSetToken } from "../services/auth.service"


// export async function register(req: FastifyRequest, reply: FastifyReply) {
// 	try {
// 		let avatarFile: any | null = null;
// 		let username = "";
// 		let email = "";
// 		let password = "";

// 		for await (const part of req.parts()) {
// 			if (part.type === "file") {
// 				if (part.fieldname === "avatar") {
// 					avatarFile = part;
// 				}
// 			} else {
// 				const field = part;
// 				if (field.fieldname === "username") {
// 					username = String(field.value);
// 				} else if (field.fieldname === "email") {
// 					email = String(field.value);
// 				} else if (field.fieldname === "password") {
// 					password = String(field.value);
// 				}
// 			}
// 		}

// 		console.log("Registering user with username:", username, "email:", email, "password:", password);
// 		if (!username || !email || !password) {
// 			return reply.status(400).send({ error: "Username, email and password are required" });
// 		}

// 		const response = await registerUser(reply.server, username, email, password, avatarFile);
// 		return reply.status(201).send(response);
// 	} catch (error) {
// 		return reply.status(400).send({ error: getErrorMessage(error) });
// 	}
// }

export async function login(
	req: FastifyRequest<{ Body: LoginBody }>,
	res: FastifyReply,
) {
	try {
		const response = await loginUser(
			res.server,
			req.body.email,
			req.body.password,
		);
		return res.status(200).send(response);
	} catch (error) {
		return res.status(400).send({ error: getErrorMessage(error) });
	}
}

export async function verify2FA(
	req: FastifyRequest<{ Body: { email: string; code: string } }>,
	res: FastifyReply,
) {
	try {
		const response = await verifyTwoFactorAuth(
			res.server,
			req.body.email,
			req.body.code,
		);
		const token = await issueAndSetToken(res.server, res, response);
		return res.send({ message: "Login successful!", token });
	} catch (error) {
		return res.status(400).send({ error: getErrorMessage(error) });
	}
}


export async function googleAuth(
	req: FastifyRequest<{ Body: { idToken: string } }>,
	res: FastifyReply,
) {
	try {
		const { idToken } = req.body;
		if (!idToken) {
			return res.status(400).send({ error: "Token is required" });
		}
		const user = await googleAuthenticator(idToken);
		const token = await issueAndSetToken(res.server, res, user.id);
		return res.status(200).send({ message: "Login successful!", token });
	} catch (error) {
		return res.status(400).send({ error: getErrorMessage(error) });
	}
}

export async function authMe(req: FastifyRequest, res: FastifyReply) {
	const user = await verifyAuth(res.server, req);
	if (!user) {
		return res.status(401).send({ error: "Unauthorized" });
	}
	return res.send(user);
}


export async function logout(req: FastifyRequest, res: FastifyReply) {
	try {
		await logoutUser(res.server, req, res);
		res.status(200).send({ message: "Logged out successfully" });
	} catch (error: any) {
		res.status(401).send({ error: error.message });
	}
}