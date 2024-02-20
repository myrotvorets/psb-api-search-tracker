import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import express, { type Express } from 'express';
import { errorMiddleware, notFoundMiddleware } from '@myrotvorets/express-microservice-middlewares';
import { installOpenApiValidator } from '@myrotvorets/oav-installer';
import { createServer, getTracer, recordErrorToSpan } from '@myrotvorets/otel-utils';

import { initializeContainer, scopedContainerMiddleware } from './lib/container.mjs';

import { requestDurationMiddleware } from './middleware/duration.mjs';
import { loggerMiddleware } from './middleware/logger.mjs';

import { trackController } from './controllers/track.mjs';
import { monitoringController } from './controllers/monitoring.mjs';

export function configureApp(app: Express): ReturnType<typeof initializeContainer> {
    return getTracer().startActiveSpan('configureApp', (span): ReturnType<typeof configureApp> => {
        try {
            const container = initializeContainer();
            const env = container.resolve('environment');
            const base = dirname(fileURLToPath(import.meta.url));
            const db = container.resolve('db');

            app.use(requestDurationMiddleware, scopedContainerMiddleware, loggerMiddleware);

            app.use('/monitoring', monitoringController(db));

            app.use(
                installOpenApiValidator(join(base, 'specs', 'search-tracker-private.yaml'), env.NODE_ENV, {
                    validateRequests: {
                        coerceTypes: true,
                    },
                }),
                trackController(),
                notFoundMiddleware,
                errorMiddleware(),
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

export async function run(): Promise<void> {
    const app = createApp();
    const container = configureApp(app);
    const server = await createServer(app);
    server.on('close', () => {
        container.dispose().catch((e) => console.error(e));
    });
}
