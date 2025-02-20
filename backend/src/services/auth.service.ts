import { FastifyInstance, FastifyReply } from "fastify";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { getUserByEmail, createUser , getUserByGoogleId, getUserById, createGooleUser} from "../models/user.model";
import { save2FACode, verify2FACode, updateJWT } from "../models/session.model";
import { sendEmail } from "./mailer.services";
import { GoogleUser, User } from "../@types/auth.types";


export async function issueAndSetToken(fastify: FastifyInstance, res: FastifyReply, userId: number): Promise<string> {
  const token = fastify.jwt.sign({ userId }, { expiresIn: "1h" });
  await updateJWT(userId, token);
  res.setCookie("token", token, {
    httpOnly: true,
    secure: false, 
    sameSite: "none",
    path: "/"
  });
  return token;
}



export async function registerUser(
  fastify: FastifyInstance,
  username: string,
  email: string,
  password: string,
) {
  if (!username || !email || !password) {
    throw new Error("All fields are required");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = await createUser(username, email, hashedPassword);

  return { message: "User registered!", userId };
}

export async function loginUser(
  fastify: FastifyInstance,
  email: string,
  password: string,
) {
  const user = await getUserByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new Error("Invalid credentials");
  }

  const twoFactorCode = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  await save2FACode(user.id, twoFactorCode, expiresAt);
  sendEmail(email, "2FA Code", `Your 2FA code is: ${twoFactorCode}`);

  return { message: "2FA code sent to email" };
}

export async function verifyTwoFactorAuth(
  fastify: FastifyInstance,
  email: string,
  code: string,
): Promise<number> {
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

