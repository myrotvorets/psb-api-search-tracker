import { FastifyError, FastifyInstance, FastifyReply, FastifyRequest, RegisterOptions, RouteSchema } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { Server, IncomingMessage, ServerResponse } from 'http';
import { GeoDecorations } from 'fastify-geo-plugin';
import knex from 'knex';
import { Tracker } from './lib/tracker';

type FastifyRegisterOptions = RegisterOptions<Server, IncomingMessage, ServerResponse>;
type NextCallback = (err?: FastifyError) => void;
type Request = FastifyRequest;
type Response = FastifyReply<ServerResponse>;

interface PSBDBDecorations {
    psbDb: knex;
}

type ExtendedFastifyInstance = FastifyInstance & GeoDecorations & PSBDBDecorations;

const trackSchema: RouteSchema = {
    body: { type: 'null' },
    querystring: {
        type: 'object',
        properties: {
            n: {
                type: 'string',
                minLength: 2,
                maxLength: 255,
            },
            b: {
                type: 'string',
                maxLength: 10,
            },
            c: {
                type: 'string',
                maxLength: 64,
            },
            a: {
                type: 'string',
                maxLength: 255,
            },
            p: {
                type: 'string',
                maxLength: 64,
            },
            d: {
                type: 'string',
                maxLength: 8192,
            },
            ra: { type: 'string' },
            ff: { type: 'string' },
            tc: { type: 'string' },
        },
        required: ['ra'],
        additionalProperties: false,
    },
    params: {
        type: 'object',
        maxProperties: 0,
        properties: {},
    },
};

function errorHandler(error: FastifyError, request: Request, reply: Response): void {
    /* istanbul ignore else */
    if (error.validation) {
        reply.code(422).send();
        return;
    }

    /* istanbul ignore next */
    if (process.env.NODE_ENV !== 'test' || process.env.DEBUG) {
        console.error('E:', error); // eslint-disable-line no-console
    }

    /* istanbul ignore next */
    reply.status(500).send();
}

function register(fastify: FastifyInstance, options: FastifyRegisterOptions, next: NextCallback): void {
    const instance = fastify as ExtendedFastifyInstance;
    const tracker = new Tracker(instance.geoLocator, instance.psbDb);

    fastify.register(function (fastify: FastifyInstance, options: FastifyRegisterOptions, next: NextCallback): void {
        fastify.setErrorHandler(errorHandler);
        fastify.get('/', { schema: trackSchema }, tracker.track.bind(tracker));

        next();
    }, options);
    next();
}

export const plugin = fastifyPlugin(register, {
    name: 'wwa:search-tracker',
    decorators: {
        fastify: ['geoLocator', 'geoCoder', 'psbDb'],
    },
});
