import { createAuthenticationError } from "./errorHandler";
import { FastifyRequest } from "fastify";


export function getUserIdFromHeader(req: FastifyRequest): number {
    const userIdHeader = req.headers['x-user-id'];
    if (!userIdHeader) {
        throw createAuthenticationError("User ID not provided");
    }
    return parseInt(userIdHeader as string, 10);
}