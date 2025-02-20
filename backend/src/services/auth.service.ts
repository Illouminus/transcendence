import { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { getUserByEmail, createUser } from "../models/user.model";
import { save2FACode, verify2FACode, updateJWT } from "../models/session.model";
import { sendEmail } from "./mailer.services";

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
  console.log(`📩 2FA Code for user ${user.email}: ${twoFactorCode}`);

  return { message: "2FA code sent to email" };
}

export async function verifyTwoFactorAuth(
  fastify: FastifyInstance,
  email: string,
  code: string,
) {
  const user = await getUserByEmail(email);
  if (!user) {
    throw new Error("Invalid credentials");
  }

  const session = await verify2FACode(user.id, code);
  if (!session) {
    throw new Error("Invalid 2FA code");
  }

  const token = fastify.jwt.sign({ userId: user.id }, { expiresIn: "1h" });

  await updateJWT(user.id, token);

  return { message: "Login successful!", token };
}


export async function googleAuthenticator(token: string)
{
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const client = new OAuth2Client(googleClientId);

  const ticket = client.verifyIdToken({
    idToken: token,
    audience: googleClientId
  })

  const payload = (await ticket).getPayload;
  if (!payload) {
        return({ code: 401,status: "Invalid google token" });
  }

  console.log(payload);
}
