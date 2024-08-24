/* eslint-disable sonarjs/no-nested-functions */
/* eslint-disable sonarjs/assertions-in-tests */
/* eslint-disable import/no-named-as-default-member */
import { expect } from 'chai';
import mockKnex from 'mock-knex';
import { container, initializeContainer } from '../../../src/lib/container.mjs';
import type { TrackingServiceInterface } from '../../../src/services/trackingserviceinterface.mjs';
import {
    dummySearchParams,
    dummyTrackingInfo,
    emptySearchParams,
    existingData,
    existingDataWithNulls,
    newData,
    piwikCode,
} from './fixtures.mjs';

describe('TrackingService', function () {
    let service: TrackingServiceInterface;
    let now: typeof Date.now;

    before(async function () {
        now = Date.now;
        Date.now = (): number => 2_000;

        await container.dispose();
        initializeContainer();
        mockKnex.mock(container.resolve('db'));
        service = container.resolve('trackService');
    });

    after(function () {
        Date.now = now;

        return container.dispose();
    });

    afterEach(function () {
        mockKnex.getTracker().uninstall();
    });

    describe('track', function () {
        it('should not track anything if search params are empty', function () {
            const tracker = mockKnex.getTracker();
            tracker.on('query', ({ sql }) => {
                expect.fail(`Unexpected query: ${sql}`);
            });

            tracker.install();
            return service.track(emptySearchParams, dummyTrackingInfo, 0);
        });

        // eslint-disable-next-line mocha/no-setup-in-describe
        [newData, existingData].forEach((dataset, i) => {
            it(`should run correctly (dataset ${i + 1})`, function () {
                const tracker = mockKnex.getTracker();
                tracker.on('query', (query, step) => {
                    expect(step).to.be.within(1, dataset.length - 1);
                    const data = dataset[step]!;
                    expect(query.method).to.equal(data.method);
                    expect(query.sql).to.match(data.sql);
                    expect(query.bindings).to.deep.equal(data.bindings);
                    query.response(data.response);
                });

                tracker.install();

                return service.track(dummySearchParams, { ...dummyTrackingInfo, piwikCode }, 0);
            });
        });

        it(`should run correctly (dataset 'existingDataWithNulls')`, function () {
            const dataset = existingDataWithNulls;
            const tracker = mockKnex.getTracker();
            tracker.on('query', (query, step) => {
                expect(step).to.be.within(1, dataset.length - 1);
                const data = dataset[step]!;
                expect(query.method).to.equal(data.method);
                expect(query.sql).to.match(data.sql);
                expect(query.bindings).to.deep.equal(data.bindings);
                query.response(data.response);
            });

            tracker.install();

            return service.track(dummySearchParams, { ...dummyTrackingInfo, locationID: 0 }, 0);
        });
    });
});
