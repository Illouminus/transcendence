import { FastifyRequest, FastifyReply } from "fastify";
import { loginUser, verifyTwoFactorAuth, googleAuthenticator, 
	logoutUser, registerUserService, updateUserService } from "../services/auth.service";
import { LoginBody, TwoFABody, RegisterUser, UserPublic } from "../@types/auth.types";
import { getErrorMessage, getErrorStatusCode, logError } from "../utils/errorHandler";
import { issueAndSetToken } from "../services/auth.service"
import { publishToQueue } from "../rabbit/rabbit"
import { getUserById, getUserByVerificationToken, verifyEmail } from "../models/user.model";


export async function loginController( req: FastifyRequest<{ Body: LoginBody }>, res: FastifyReply) {
	try {
		const response = await loginUser(req.body.email, req.body.password);
		if(response.user)
		{
			const token = await issueAndSetToken(res.server, res, response.user?.user_id);
			return res.status(200).send({message: "Login successful", token: token});
		}
		else
		{
			return res.status(200).send({message: "2FA code sent to email", email: req.body.email});
		}
	} catch (error) {
		return res.status(400).send({ error: getErrorMessage(error) });
	}
}



export async function getUserInfoController(req: FastifyRequest, res: FastifyReply) {
	try {
		const userIdHeader = req.headers['x-user-id'];
		if (!userIdHeader) {
			return res.status(401).send({ error: "User ID not provided" });
		}
		const userId = parseInt(userIdHeader as string, 10);
		const user = await getUserById(userId);

		if (!user) {
			return res.status(404).send({ error: "User not found" });
		}
		const publicProfile: UserPublic = {
			id: user.id,
			is_verified: user.is_verified,
			two_factor_enabled: user.two_factor_enabled,
			is_google_auth: user.google_id ? true : false,
			email: user.email,
		};

		return res.status(200).send({ user: publicProfile });
	} catch (error) {
		return res.status(getErrorStatusCode(error)).send({ error: getErrorMessage(error) });
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

export async function googleAuthLogin( req: FastifyRequest<{ Body: { idToken: string } }>, res: FastifyReply) {
	try {
		const { idToken } = req.body;

		console.log("ID Token AUTH SERVICE: ", idToken);
		if (!idToken) {
			return res.status(400).send({ error: "Token is required" });
		}

		const user = await googleAuthenticator(idToken);
		if (!user) {
			return res.status(400).send({ error: "Login failed" });
		}
		const token = await issueAndSetToken(res.server, res, user.user_id);
		return res.status(200).send({message: "Login successful!", token : token});
		
	} catch (error) {
		return res.status(getErrorStatusCode(error)).send({ error: getErrorMessage(error) });
	}
}

export async function registerController(req: FastifyRequest<{Body: RegisterUser}>, reply: FastifyReply) {
	try {
	  const { username, email, password } = req.body;
	  // quick validation of password with regex
	  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{7,}$/;
	  if (!passwordRegex.test(password)) {
		return reply.status(400).send({ error: "Password must be at least 7 characters long, contain at least one uppercase letter, one lowercase letter, and one number." });
	  }
	  // check the email format
	  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	  if (!emailRegex.test(email)) {
		return reply.status(400).send({ error: "Invalid email format" });
	  }

	  if(!username || !email || !password) {
		return reply.status(400).send({ error: "All fields are required" });
	  }

	  const user = await registerUserService( username, email, password);
	  publishToQueue("user.created", { userId: user.id, email: user.email, username: user.username });
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


