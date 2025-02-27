import { FastifyRequest, FastifyReply } from "fastify";
import { loginUser, verifyTwoFactorAuth, googleAuthenticator, logoutUser, registerUserService } from "../services/auth.service";
import { LoginBody, TwoFABody, RegisterUser } from "../@types/auth.types";
import { getErrorMessage, getErrorStatusCode, logError } from "../utils/errorHandler";
import { issueAndSetToken } from "../services/auth.service"
import { publishToQueue } from "../rabbit/rabbit"


export async function login( req: FastifyRequest<{ Body: LoginBody }>, res: FastifyReply) {
	try {
		const response = await loginUser(req.body.email, req.body.password);
		return res.status(200).send(response);
	} catch (error) {
		return res.status(400).send({ error: getErrorMessage(error) });
	}
}



export async function verify2FA( req: FastifyRequest<{Body: TwoFABody}>, res: FastifyReply,) {
	try {
		const response = await verifyTwoFactorAuth( res.server, req.body.email, req.body.code);
		await issueAndSetToken(res.server, res, response);
		return res.send({ message: "Login successful!" });
	} catch (error) {
		return res.status(400).send({ error: getErrorMessage(error) });
	}
}


export async function googleAuth( req: FastifyRequest<{ Body: { idToken: string } }>, res: FastifyReply) {
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

export async function registerUser(req: FastifyRequest<{Body: RegisterUser}>, reply: FastifyReply) {
	try {
	  const { username, email, password } = req.body;

	  if(!username || !email || !password) {
		return reply.status(400).send({ error: "All fields are required" });
	  }

	  const user = await registerUserService( username, email, password);
	  publishToQueue("user.registered", { email: user.email, username: user.username });
	  
	  return reply.status(201).send({message : "Registration successful"});
	} catch (error) {
	  logError(error, "registerUser");
	  return reply.status(getErrorStatusCode(error)).send({ error: getErrorMessage(error) });
	}
  }


export async function logout(req: FastifyRequest, res: FastifyReply) {
	try {
		await logoutUser(req, res);
		res.status(200).send({ message: "Logged out successfully" });
	} catch (error: any) {
		res.status(401).send({ error: error.message });
	}
}