import { FastifyRequest, FastifyReply } from "fastify";
import {
	registerUser,
	loginUser,
	verifyTwoFactorAuth,
	googleAuthenticator
} from "../services/auth.service";
import { RegisterBody, LoginBody } from "../@types/auth.types";
import { getErrorMessage } from "../utils/errorHandler";

export async function register(
	req: FastifyRequest<{ Body: RegisterBody }>,
	res: FastifyReply,
) {
	try {
		const response = await registerUser(
			res.server,
			req.body.username,
			req.body.email,
			req.body.password,
		);
		return res.status(201).send(response);
	} catch (error) {
		return res.status(400).send({ error: getErrorMessage(error) });
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
		return res.send(response);
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
		res.setCookie("token", response.token, { httpOnly: true, secure: false });
		return res.send(response);
	} catch (error) {
		return res.status(400).send({ error: getErrorMessage(error) });
	}
}


export async function googleAuth(req: FastifyRequest<{ Body: { token: string } }>, res: FastifyReply) {
	try {
		const { token } = req.body;
		if (!token) {
			return res.status(400).send({ error: "Token is required" });
		}

		const response = await googleAuthenticator(token);
		// res.setCookie("token", response.token, { httpOnly: true, secure: false });
		// return res.send(response);
	} catch (error) {
		return res.status(400).send({ error: getErrorMessage(error) });
	}
}