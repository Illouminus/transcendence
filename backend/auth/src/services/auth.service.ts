import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { getUserByEmail, getUserByGoogleId,getUserById, createGooleUser, deleteSession, dbCreateUser, updateUserData} from "../models/user.model";
import { save2FACode, verify2FACode, updateJWT } from "../models/auth.model";
import { sendEmail } from "./mailer.services";
import { GoogleUser, User} from "../@types/auth.types";
import { getUserIdFromJWT } from "../utils/jwtUtils";
import { createDatabaseError, createNotFoundError, logError } from "../utils/errorHandler";


export async function issueAndSetToken(fastify: FastifyInstance, res: FastifyReply, userId: number): Promise<string> {
	const token = fastify.jwt.sign({ userId }, { expiresIn: "1h" });
	await updateJWT(userId, token);
	res.setCookie("token", token, {
		httpOnly: true,
		secure: true,
		sameSite: "none",
		path: "/"
	});
	return token;
}


export async function loginUser( email: string, password: string) {
	
	const user = await getUserByEmail(email);
	if (!user || !user.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
		throw new Error("Invalid credentials");
	}

	const twoFactorCode = crypto.randomInt(100000, 999999).toString();

	const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

	await save2FACode(user.id, twoFactorCode, expiresAt);

	if (!sendEmail(email, "2FA Code", `Your 2FA code is: ${twoFactorCode}`)) {
		throw new Error("Failed to send 2FA code");
	}
	return { message: "2FA code sent to email" };
}

export async function verifyTwoFactorAuth( fastify: FastifyInstance, email: string, code: string, ): Promise<number> {
	const user = await getUserByEmail(email);
	if (!user) {
		throw new Error("Invalid credentials");
	}

	const session = await verify2FACode(user.id, code);
	if (!session) {
		throw new Error("Invalid 2FA code");
	}
	return user.id
}


export async function googleAuthenticator(idToken: string): Promise<User> {
	const googleClientId = process.env.GOOGLE_CLIENT_ID;
	const client = new OAuth2Client(googleClientId);

	const ticket = await client.verifyIdToken({
		idToken,
		audience: googleClientId,
	});

	const payload = ticket.getPayload();

	if (!payload) {
		throw new Error("Invalid google token");
	}

	const { name, email, picture, sub } = payload as GoogleUser;

	let user = await getUserByGoogleId(sub);

	if (!user) {
		const userId = await createGooleUser({ name, email, picture, sub });
		user = await getUserById(userId);
		if (!user) {
			throw new Error("User creation failed");
		}
	}
	return user;
}


export async function logoutUser( req: FastifyRequest, res: FastifyReply ): Promise<void> {
	const userId = await getUserIdFromJWT(res.server, req);
	if (!userId) {
		throw new Error("Unauthorized");
	}

	await deleteSession(userId);

	res.clearCookie("token", {
		path: "/",
		httpOnly: true,
		secure: true,
		sameSite: "none",
	});
}


export async function registerUserService( username: string, email: string, password: string): Promise<User> {

	const existingUser = await getUserByEmail(email);
	if (existingUser) {
		throw new Error("User already exists");
	}
	const passwordHash = await bcrypt.hash(password, 10);

	const newUser = await dbCreateUser(username, email, passwordHash );
	
	if (!newUser) {
		throw new Error("User creation failed");
	}
	return newUser;
}


export async function updateUserService( username: string, email: string, password?: string | null): Promise<User | null> {
	try {
	  const currentUser = await getUserByEmail(email!);

	  if (!currentUser) {
		throw createNotFoundError("User not found");
	  }
	  let hashedPassword: string | null = null;
	  if (password && password.trim() !== "") {
		hashedPassword = await bcrypt.hash(password, 10);
	  }

	  const updatedUser = await updateUserData(currentUser.id, {
		username,
		email,
		password_hash: hashedPassword,
	  });

	  return updatedUser;
	} catch (error) {
	  logError(error, "updateUserService");
	  throw createDatabaseError("Failed to update user", {
		username,
		email,
		error: error instanceof Error ? error.message : "Unknown error",
	  });
	}
  }