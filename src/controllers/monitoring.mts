import {
    HealthChecker,
    HealthEndpoint,
    LivenessEndpoint,
    ReadinessCheck,
    ReadinessEndpoint,
    ShutdownCheck,
} from '@cloudnative/health-connect';
import { addJsonContentTypeMiddleware } from '@myrotvorets/express-microservice-middlewares';
import { Router } from 'express';
import type { Knex } from 'knex';

export let healthChecker: HealthChecker | undefined; // NOSONAR

export function monitoringController(db: Knex, manticore: Knex | null): Router {
    const router = Router();

    healthChecker = new HealthChecker();

    const dbCheck = new ReadinessCheck('database', (): Promise<void> => {
        const client = db.client as Knex.Client;
        const connection = client.acquireConnection() as Promise<unknown>;
        return connection.then((conn) => client.releaseConnection(conn) as Promise<void>);
    });

    healthChecker.registerReadinessCheck(dbCheck);

    if (manticore !== null) {
        const manticoreCheck = new ReadinessCheck('manticore', (): Promise<void> => {
            const client = manticore.client as Knex.Client;
            const connection = client.acquireConnection() as Promise<unknown>;
            return connection.then((conn) => client.releaseConnection(conn) as Promise<void>);
        });

        healthChecker.registerReadinessCheck(manticoreCheck);
    }

    healthChecker.registerShutdownCheck(new ShutdownCheck('SIGTERM', (): Promise<void> => Promise.resolve()));

    router.use(addJsonContentTypeMiddleware);
    router.get('/live', LivenessEndpoint(healthChecker));
    router.get('/ready', ReadinessEndpoint(healthChecker));
    router.get('/health', HealthEndpoint(healthChecker));

    return router;
}
