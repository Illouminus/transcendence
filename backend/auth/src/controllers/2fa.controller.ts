import { FastifyRequest, FastifyReply } from "fastify";
import { getErrorMessage, getErrorStatusCode, logError } from "../utils/errorHandler";
import { getUserById } from "../models/user.model";
import { disableTwoFactorAuth, enableTwoFactorAuth } from "../models/2fa.models";
import { issueAndSetToken, verifyTwoFactorAuth } from "../services/auth.service";
import { TwoFABody } from "../@types/auth.types";



export async function enable2FAController(req: FastifyRequest, res: FastifyReply) {
    try {
        const userIdHeader = req.headers['x-user-id'];
		if (!userIdHeader) {
			return res.status(401).send({ error: "User ID not provided" });
		}
		const userId = parseInt(userIdHeader as string, 10);

        const user = await getUserById(userId);
        if (!user) {
            return res.status(400).send({ error: "User not found" });
        }
        if (user.two_factor_enabled) {
            return res.status(400).send({ error: "Two factor authentication is already enabled" });
        }
        await enableTwoFactorAuth(user.id);
        return res.send({ message: "Two factor authentication enabled" });
    } catch (error) {
        return res.status(getErrorStatusCode(error)).send({ error: getErrorMessage(error) });
    }
}



export async function disable2FAController(req: FastifyRequest, res: FastifyReply) {
    try {
        const userIdHeader = req.headers['x-user-id'];
		if (!userIdHeader) {
			return res.status(401).send({ error: "User ID not provided" });
		}
		const userId = parseInt(userIdHeader as string, 10);

        const user = await getUserById(userId);
        if (!user) {
            return res.status(400).send({ error: "User not found" });
        }
        if (!user.two_factor_enabled) {
            return res.status(400).send({ error: "Two factor authentication is not enabled" });
        }
        await disableTwoFactorAuth(user.id);
        return res.send({ message: "Two factor authentication disabled" });
    } catch (error) {
        return res.status(getErrorStatusCode(error)).send({ error: getErrorMessage(error) });
    }
}



export async function verify2FAController( req: FastifyRequest<{Body: TwoFABody}>, res: FastifyReply,) {
    try {
        const response = await verifyTwoFactorAuth( res.server, req.body.email, req.body.code);
        const token = await issueAndSetToken(res.server, res, response);
        return res.status(200).send({message: "Login successful", token: token});
    } catch (error) {
        return res.status(400).send({ error: getErrorMessage(error) });
    }
}
