import fastify from 'fastify';
import fastifyHttpProxy from '@fastify/http-proxy';
import config from './config';

// Create an instance of Fastify server
const server = fastify({
    logger: true,
});

// Register the HTTP Proxy plugin with our configuration for the auth service
server.register(fastifyHttpProxy, {
    upstream: config.services.auth_service,
    prefix: '/auth',
    rewritePrefix: "",
    http2: false,
    websocket: false,
});


// Register the HTTP Proxy plugin with our configuration for the user service
server.register(fastifyHttpProxy, {
    upstream: config.services.user_service,
    prefix: '/user',
    rewritePrefix: "",
    http2: false,
    websocket: false,
});

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