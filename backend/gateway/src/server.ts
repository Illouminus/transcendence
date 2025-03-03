import fastify, { FastifyReply, FastifyRequest } from 'fastify';
import fastifyHttpProxy from '@fastify/http-proxy';
import fastifyStatic from '@fastify/static';
import fastifyJwt, { FastifyJWT, JWT } from '@fastify/jwt';
import fastifyCookie from "@fastify/cookie";
import cors from "@fastify/cors";
import config from './config';

// Create an instance of Fastify server
const server = fastify({
    logger: true,
});


server.register(cors, {
	origin: config.server.corsOrigin,
	credentials: true,
  });


server.register(fastifyJwt, {
    secret: config.security.jwtSecret,
  });


  server.register(fastifyCookie, {
	secret: config.security.cookieSecret,
	parseOptions: {
	  httpOnly: true,
	  secure: config.server.env === 'production',
	  sameSite: 'none',
	},
  });
// Register the HTTP Proxy plugin with our configuration for the auth service
server.register(fastifyHttpProxy, {
    upstream: config.services.auth_service,
    prefix: '/auth',
    rewritePrefix: "",
    http2: false,
    websocket: false,
});


// Register the static plugin with our configuration - to serve images from the public folder
// For example, if you have an image in the public/images folder called my-image.jpg, you can access it at http://localhost:5000/images/my-image.jpg
// As usual HTTP requests, you can access the image by using the URL http://localhost:5000/images/my-image.jpg
// server.register(fastifyStatic, {
// 	root: config.files.uploadsDir,
// 	prefix: "/images/",
// 	decorateReply: false,
// });


interface JwtPayload {
  userId: number;
}

server.register(fastifyHttpProxy, {
  upstream: config.services.user_service,
  prefix: '/user',
  rewritePrefix: "",
  http2: false,
  websocket: false,
  // Здесь мы используем rewriteHeaders для модификации заголовков перед отправкой запроса
  preHandler: async (req: FastifyRequest, reply: FastifyReply) => {
    const token =
      req.cookies.token || req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        const decoded = server.jwt.verify<JwtPayload>(token);
        if (typeof decoded !== 'string' && decoded.userId) {
          req.headers['x-user-id'] = decoded.userId.toString();
          console.log('[Gateway] preHandler attached x-user-id:', req.headers['x-user-id']);
        }
      } catch (err) {
        console.error('[Gateway] Token verification error in preHandler:', err);
      }
    }
  },
});


// Register the HTTP Proxy plugin with our configuration for the user service
// server.register(fastifyHttpProxy, {
//     upstream: config.services.user_service,
//     prefix: '/user',
//     rewritePrefix: "",
//     http2: false,
//     websocket: false,
//     preHandler: verifyJWT,
//   }
// );

// Register the HTTP Proxy plugin with our configuration for the game service
server.register(fastifyHttpProxy, {
    upstream: config.services.game_service,
    prefix: '/game',
    rewritePrefix: "",
    http2: false,
    websocket: true,
});

// Register the HTTP Proxy plugin with our configuration for the chat service
server.register(fastifyHttpProxy, {
    upstream: config.services.chat_service,
    prefix: '/chat',
    rewritePrefix: "",
    http2: false,
    websocket: true,
});

const start  =  async () => {
    try {
        await server.listen({
            port: config.server.port, 
            host: config.server.host
        });
        server.log.info(`Gateway server listening on ${server.server.address()}`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
}

start();