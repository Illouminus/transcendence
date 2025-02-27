import fastify from 'fastify';
import fastifyHttpProxy from '@fastify/http-proxy';
import fastifyStatic from '@fastify/static';
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


// Register the static plugin with our configuration - to serve images from the public folder
// For example, if you have an image in the public/images folder called my-image.jpg, you can access it at http://localhost:5000/images/my-image.jpg
// As usual HTTP requests, you can access the image by using the URL http://localhost:5000/images/my-image.jpg
// server.register(fastifyStatic, {
// 	root: config.files.uploadsDir,
// 	prefix: "/images/",
// 	decorateReply: false,
// });


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