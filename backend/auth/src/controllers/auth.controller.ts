import { FastifyRequest, FastifyReply } from "fastify";
import { loginUser, verifyTwoFactorAuth, googleAuthenticator, verifyAuth, logoutUser } from "../services/auth.service";
import { getErrorMessage } from "../utils/errorHandler";
import { issueAndSetToken } from "../services/auth.service"


 interface LoginBody {
	email: string;
	password: string;
}

interface TwoFABody {
	email: string;
	code: string;
}

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

// export async function authMe(req: FastifyRequest, res: FastifyReply) {
// 	const user = await verifyAuth(res.server, req);
// 	if (!user) {
// 		return res.status(401).send({ error: "Unauthorized" });
// 	}
// 	return res.send(user);
// }

export async function logout(req: FastifyRequest, res: FastifyReply) {
	try {
		await logoutUser(req, res);
		res.status(200).send({ message: "Logged out successfully" });
	} catch (error: any) {
		res.status(401).send({ error: error.message });
	}
}