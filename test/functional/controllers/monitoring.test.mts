import type { RequestListener } from 'node:http';
import { expect } from 'chai';
import request from 'supertest';
import * as knexpkg from 'knex';
import mockKnex from 'mock-knex';
import { createApp } from '../../../src/server.mjs';
import { healthChecker, monitoringController } from '../../../src/controllers/monitoring.mjs';
import { buildKnexDatabaseConfig, buildKnexManticoreConfig } from '../../../src/knexfile.mjs';

describe('MonitoringController', function () {
    let app: RequestListener;
    let db: knexpkg.Knex;
    let manticore: knexpkg.Knex;

    before(function () {
        const { knex } = knexpkg.default;
        db = knex(buildKnexDatabaseConfig({ KNEX_DATABASE_NAME: 'fake' }));
        mockKnex.mock(db);

        manticore = knex(
            buildKnexManticoreConfig({ KNEX_MANTICORE_HOST: 'example.local', KNEX_MANTICORE_DRIVER: 'mysql2' })!,
        );
        mockKnex.mock(manticore);

        const application = createApp();
        application.use('/monitoring', monitoringController(db, manticore));
        app = application as RequestListener;
    });

    beforeEach(function () {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        expect(healthChecker).not.to.be.undefined;
        healthChecker!.shutdownRequested = false;
    });

    after(function () {
        mockKnex.unmock(db);
        mockKnex.unmock(manticore);
        return Promise.all([db.destroy(), manticore.destroy()]);
    });

    afterEach(function () {
        process.removeAllListeners('SIGTERM');
    });

    const checker200 = (endpoint: string): Promise<unknown> =>
        request(app).get(`/monitoring/${endpoint}`).expect('Content-Type', /json/u).expect(200);

    const checker503 = (endpoint: string): Promise<unknown> => {
        healthChecker!.shutdownRequested = true;
        return request(app).get(`/monitoring/${endpoint}`).expect('Content-Type', /json/u).expect(503);
    };

    describe('Liveness Check', function () {
        it('should succeed', function () {
            return checker200('live');
        });

        it('should fail when shutdown requested', function () {
            return checker503('live');
        });
    });

    describe('Readiness Check', function () {
        it('should succeed', function () {
            return checker200('ready');
        });

        it('should fail when shutdown requested', function () {
            return checker503('ready');
        });
    });

    describe('Health Check', function () {
        it('should succeed', function () {
            return checker200('health');
        });

        it('should fail when shutdown requested', function () {
            return checker503('health');
        });
    });
});
