import "@fastify/jwt";

declare module "fastify" {
	interface FastifyInstance {
		jwt: {
			sign(payload: object, options?: object): string;
			verify<T>(token: string): T;
		};
		authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
	}
}
