import { FastifyRequest, FastifyReply } from "fastify";
import {
	registerUser,
	loginUser,
	verifyTwoFactorAuth,
	googleAuthenticator
} from "../services/auth.service";
import { RegisterBody, LoginBody } from "../@types/auth.types";
import { getErrorMessage } from "../utils/errorHandler";
import {issueAndSetToken} from "../services/auth.service"

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
	  return res.send({ message: "Login successful!", token });
	} catch (error) {
	  return res.status(400).send({ error: getErrorMessage(error) });
	}
  }
  