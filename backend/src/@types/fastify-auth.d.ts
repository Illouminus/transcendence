import { FastifyRequest, FastifyReply } from "fastify";

// 1. Импортируем "fastify" для модульного расширения
import "fastify";

// 2. Объявляем модуль
declare module "fastify" {
	interface FastifyInstance {
		authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
	}
}

// 3. Обязательно экспортируем что-то (или делаем export {})
export { };