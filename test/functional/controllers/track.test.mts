/* eslint-disable import/no-named-as-default-member */
import { type Express } from 'express';
import request from 'supertest';
import mockKnex from 'mock-knex';
import { expect } from 'chai';
import { configureApp, createApp } from '../../../src/server.mjs';
import { container } from '../../../src/lib/container.mjs';
import { TrackingRequestBody } from '../../../src/controllers/track.mjs';

const dummyBody = {
    name: '',
    dob: '',
    country: '',
    address: '',
    phone: '',
    desc: '',
    ra: '127.0.0.1',
    ff: '',
    tc: '',
    loc: 0,
    src: 1,
};

describe('DecodeController', function () {
    let app: Express;

    before(async function () {
        await container.dispose();
        app = createApp();
        configureApp(app);

        mockKnex.mock(container.resolve('db'));
    });

    after(function () {
        return container.dispose();
    });

    afterEach(function () {
        mockKnex.getTracker().uninstall();
    });

    describe('Error Handling', function () {
        it('should fail the request without body', function () {
            return request(app)
                .post('/track')
                .set('Content-Type', 'application/json')
                .expect(400)
                .expect(/"code":"BAD_REQUEST"/u);
        });

        it('should fail non-JSON requests', function () {
            return request(app)
                .post('/track')
                .set('Content-Type', 'text/plain')
                .send(
                    '{"name": "", "dob": "", "country": "", "address": "", "phone": "", "desc": "", "ra": "127.0.0.1", "ff": "", "tc": "", "loc": 0, "src": 1}',
                )
                .expect(415);
        });

        // eslint-disable-next-line mocha/no-setup-in-describe
        [
            {},
            { ...dummyBody, ra: '' },
            { ...dummyBody, ra: '256.0.0.1' },
            { ...dummyBody, loc: -1 },
            { ...dummyBody, src: -1 },
        ].forEach((body) => {
            it(`should fail the request with invalid body (${JSON.stringify(body)})`, function () {
                return request(app)
                    .post('/track')
                    .set('Content-Type', 'application/json')
                    .send(body)
                    .expect(400)
                    .expect(/"code":"BAD_REQUEST"/u);
            });
        });
    });

    describe('Normal behavior', function () {
        it('should return a 204 if everything is OK', function () {
            const tracker = mockKnex.getTracker();
            const responses = [
                [], // N/A
                [], // 'BEGIN',
                [{ id: 1 }], // select from piwik
                [{ id: 1 }], // select from search_queries
                [1], // insert into searches
                [], // 'COMMIT',
            ];

            tracker.on('query', (query, step) => {
                expect(step).to.be.within(1, 5);
                query.response(responses[step]!);
            });

            tracker.install();

            const req: TrackingRequestBody = {
                name: 'John Doe',
                dob: '1970-01-01',
                country: 'US',
                address: '123 Main St',
                phone: '123-456-7890',
                desc: 'Some description',
                ra: '127.0.0.1',
                ff: '',
                tc: '',
                loc: 0,
                src: 1,
            };

            return request(app).post('/track').send(req).expect(204);
        });
    });
});
