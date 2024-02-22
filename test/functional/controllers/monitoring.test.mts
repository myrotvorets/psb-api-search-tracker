/* eslint-disable import/no-named-as-default-member */
import { expect } from 'chai';
import { type Express } from 'express';
import request from 'supertest';
import * as knexpkg from 'knex';
import mockKnex from 'mock-knex';
import { createApp } from '../../../src/server.mjs';
import { healthChecker, monitoringController } from '../../../src/controllers/monitoring.mjs';
import { buildKnexConfig } from '../../../src/knexfile.mjs';

describe('MonitoringController', function () {
    let app: Express;
    let db: knexpkg.Knex;

    before(function () {
        const { knex } = knexpkg.default;
        db = knex(buildKnexConfig({ KNEX_DATABASE: 'fake' }));
        mockKnex.mock(db);

        app = createApp();
        app.use('/monitoring', monitoringController(db));
    });

    beforeEach(function () {
        expect(healthChecker).not.to.be.undefined;
        healthChecker!.shutdownRequested = false;
    });

    after(function () {
        mockKnex.unmock(db);
        return db.destroy();
    });

    afterEach(function () {
        process.removeAllListeners('SIGTERM');
        mockKnex.getTracker().uninstall();
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
