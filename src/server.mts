import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import express, { type Express, type Request, type Response, json } from 'express';
import { errorMiddleware, notFoundMiddleware } from '@myrotvorets/express-microservice-middlewares';
import { installOpenApiValidator } from '@myrotvorets/oav-installer';
import { createServer, getTracer, recordErrorToSpan } from '@myrotvorets/otel-utils';
import {
    type LoggerFromRequestFunction,
    errorLoggerHook,
    requestDurationMiddleware,
    requestLoggerMiddleware,
} from '@myrotvorets/express-otel-middlewares';

import { LocalsWithContainer, initializeContainer, scopedContainerMiddleware } from './lib/container.mjs';
import { requestDurationHistogram } from './lib/otel.mjs';

import { trackController } from './controllers/track.mjs';
import { monitoringController } from './controllers/monitoring.mjs';

const loggerFromRequest: LoggerFromRequestFunction = (req: Request) =>
    (req.res as Response<never, LocalsWithContainer> | undefined)?.locals.container.resolve('logger');

export function configureApp(app: Express): ReturnType<typeof initializeContainer> {
    return getTracer().startActiveSpan('configureApp', (span): ReturnType<typeof configureApp> => {
        try {
            const container = initializeContainer();
            const env = container.resolve('environment');
            const base = dirname(fileURLToPath(import.meta.url));
            const db = container.resolve('db');
            const manticore = container.resolve('manticore');

            app.use(
                requestDurationMiddleware(requestDurationHistogram),
                scopedContainerMiddleware,
                requestLoggerMiddleware('search-tracker', loggerFromRequest),
            );

            app.use('/monitoring', monitoringController(db, manticore));

            app.use(
                json(),
                installOpenApiValidator(join(base, 'specs', 'search-tracker-private.yaml'), env.NODE_ENV, {
                    validateRequests: {
                        coerceTypes: true,
                    },
                }),
                trackController(),
                notFoundMiddleware,
                errorMiddleware({
                    beforeSendHook: errorLoggerHook(loggerFromRequest),
                }),
            );

            return container;
        } /* c8 ignore start */ catch (e) {
            recordErrorToSpan(e, span);
            throw e;
        } /* c8 ignore stop */ finally {
            span.end();
        }
    });
}

export function createApp(): Express {
    const app = express();
    app.set('strict routing', true);
    app.set('case sensitive routing', true);
    app.set('x-powered-by', false);
    app.set('trust proxy', true);
    return app;
}

/* c8 ignore start */
export async function run(): Promise<void> {
    const app = createApp();
    const container = configureApp(app);
    const server = await createServer(app);
    server.on('close', () => {
        container.dispose().catch((e) => console.error(e));
    });
}
/* c8 ignore stop */
