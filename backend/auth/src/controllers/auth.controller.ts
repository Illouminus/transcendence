import { FastifyRequest, FastifyReply } from "fastify";
import { loginUser, verifyTwoFactorAuth, googleAuthenticator, 
	logoutUser, registerUserService, updateUserService } from "../services/auth.service";
import { LoginBody, TwoFABody, RegisterUser } from "../@types/auth.types";
import { getErrorMessage, getErrorStatusCode, logError } from "../utils/errorHandler";
import { issueAndSetToken } from "../services/auth.service"
import { publishToQueue } from "../rabbit/rabbit"
import { getUserByVerificationToken, verifyEmail } from "../models/user.model";


export async function loginController( req: FastifyRequest<{ Body: LoginBody }>, res: FastifyReply) {
	try {
		console.log(req.body);
		const response = await loginUser(req.body.email, req.body.password);
		return res.status(200).send(response);
	} catch (error) {
		return res.status(400).send({ error: getErrorMessage(error) });
	}
}

export async function verifyEmailController(req: FastifyRequest<{Querystring: {token: string}}>, res: FastifyReply) {
	try {
		const {token} = req.query;
		if (!token) {
			return res.status(400).send({ error: "Token is required" });
		}
		const user = await getUserByVerificationToken(token);
		if (!user) {
			return res.status(400).send({ error: "Invalid token" });
		}
		await verifyEmail(user.id);
		return res.redirect(`${process.env.FRONTEND_URL}/login`);
	} catch (error) {
		return res.status(400).send({ error: getErrorMessage(error) });
	}
}


export async function verify2FAController( req: FastifyRequest<{Body: TwoFABody}>, res: FastifyReply,) {
	try {
		const response = await verifyTwoFactorAuth( res.server, req.body.email, req.body.code);
		await issueAndSetToken(res.server, res, response);
		return res.send({ message: "Login successful!" });
	} catch (error) {
		return res.status(400).send({ error: getErrorMessage(error) });
	}
}


export async function googleAuthLogin( req: FastifyRequest<{ Body: { idToken: string } }>, res: FastifyReply) {
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

export async function registerController(req: FastifyRequest<{Body: RegisterUser}>, reply: FastifyReply) {
	try {
	  const { username, email, password } = req.body;

	  if(!username || !email || !password) {
		return reply.status(400).send({ error: "All fields are required" });
	  }

	  const user = await registerUserService( username, email, password);
	  publishToQueue("user.registered", { userId: user.id, email: user.email, username: user.username });
	  
	  return reply.status(201).send({message : "User registered!"});
	} catch (error) {
	  logError(error, "registerUser");
	  return reply.status(getErrorStatusCode(error)).send({ error: getErrorMessage(error) });
	}
  }


export async function logoutController(req: FastifyRequest, res: FastifyReply) {
	try {
		await logoutUser(req, res);
		res.status(200).send({ message: "Logged out successfully" });
	} catch (error: any) {
		res.status(401).send({ error: error.message });
	}
}

export async function updateController(req: FastifyRequest<{Body: RegisterUser}>, res: FastifyReply) {
	try {

		const userIdHeader = req.headers['x-user-id'];
		if (!userIdHeader) {
			return res.status(401).send({ error: "User ID not provided" });
		}
		const userId = parseInt(userIdHeader as string, 10);

		const {email, username, password} = req.body;
		if (!email || !username) {
			res.status(400).send({ error: "All fields are required" });
		}
		const user = await updateUserService(userId, username, email, password);
		if (!user) 
		{
			res.status(404).send({ error: "Update failed" });
		} 
		else 
		{
			publishToQueue("user.updated", { userId: user.id, username: user.username, email: user.email });
			
			res.status(200).send({ message: "User updated successfully" });
		}
	} catch (error: any) {
		res.status(401).send({ error: error.message });
	}
}