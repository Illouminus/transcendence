import { FastifyRequest, FastifyReply } from "fastify";
import {
	registerUser,
	loginUser,
	verifyTwoFactorAuth,
	googleAuthenticator,
	verifyAuth,
	logoutUser
} from "../services/auth.service";
import { RegisterBody, LoginBody } from "../@types/auth.types";
import { getErrorMessage } from "../utils/errorHandler";
import { issueAndSetToken } from "../services/auth.service"

export async function register(req: FastifyRequest, reply: FastifyReply) {
	try {
		const data = await req.file();
		if (!data) {
			return reply.status(400).send({ error: "File data is missing" });
		}
		const fields = data.fields as { [key: string]: { value: string } };
		const username = fields.username?.value || "";
		const email = fields.email?.value || "";
		const password = fields.password?.value || "";

		const response = await registerUser(reply.server, username, email, password, data);

		return reply.status(201).send(response);
	} catch (error) {
		return reply.status(400).send({ error: getErrorMessage(error) });
	}
}

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