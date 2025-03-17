import fastify, { FastifyReply, FastifyRequest } from 'fastify';
import fastifyHttpProxy from '@fastify/http-proxy';
import fastifyStatic from '@fastify/static';
import fastifyJwt, { FastifyJWT, JWT } from '@fastify/jwt';
import fastifyCookie from "@fastify/cookie";
import cors from "@fastify/cors";
import config from './config';
import { AuthUser, Profile, UserProfile } from './types';


// Create an instance of Fastify server
const server = fastify({logger: true});

server.register(cors, {
	origin: config.server.corsOrigin,
	credentials: true,
  });


server.register(fastifyJwt, {secret: config.security.jwtSecret});

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
  prefix: '/auth/update',
  rewritePrefix: "/update",
  http2: false,
  websocket: false,
  preHandler: verifyJWT
});


server.register(fastifyHttpProxy, {
    upstream: config.services.auth_service,
    prefix: '/auth',
    rewritePrefix: "",
    http2: false,
    websocket: false,
});


async function verifyJWT(req: FastifyRequest, reply: FastifyReply) {
  req.log.info('Verifying JWT');
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  try {
    if(token)
    {
      const decoded = server.jwt.verify<JwtPayload>(token);
      if (typeof decoded !== 'string' && decoded.userId) {
        req.headers['x-user-id'] = decoded.userId.toString();
      }
    }
    // else
    //   reply.status(404).send("Acces refused");
  } catch (error) {
      reply.status(401).send("Acces refused");
  }
}


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
  preHandler: verifyJWT,
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
    preHandler: verifyJWT,
});

// Register the HTTP Proxy plugin with our configuration for the chat service
server.register(fastifyHttpProxy, {
    upstream: config.services.chat_service,
    prefix: '/chat',
    rewritePrefix: "",
    http2: false,
    websocket: true,
});


server.get('/aggregated/profile', {preHandler: verifyJWT}, async (req, reply) => {
  const userId = req.headers['x-user-id'];
  
  if (!userId) {
    return reply.status(401).send({ error: 'No userId in token' });
  }

  try {

    // ----------------- Get user data from auth service -----------------
    const authUrl = `${config.services.auth_service}/me`;
    const authResponse = await fetch(authUrl, {
      method: 'GET',
      headers: {
        'x-user-id': userId.toString(),
      }
    });
    const authJson: AuthUser = await authResponse.json();
   
    // ----------------- Get user data from user service -----------------
    const userUrl = `${config.services.user_service}/me`;
    const userResponse = await fetch(userUrl, {
      method: 'GET',
      headers: {
        'x-user-id': userId.toString(),
      }
    });
    const userJson: UserProfile = await userResponse.json();

    const profile: Profile = {
      id: userJson.id,
      is_verified: authJson.user.is_verified,
      two_factor_enabled: authJson.user.two_factor_enabled,
      username: userJson.username,
      email: userJson.email,
      avatar: userJson.avatarUrl,
      wins: userJson.wins,
      losses: userJson.losses,
      achievements: userJson.achievements,
    };


    return profile;
  } catch (error) {
    return reply.status(500).send({ error: 'Error fetching profile data' });
  }
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