/* eslint-disable import/no-named-as-default-member */
import { expect } from 'chai';
import mockKnex from 'mock-knex';
import { container, initializeContainer } from '../../../src/lib/container.mjs';
import { ModelService } from '../../../src/services/modelservice.mjs';
import { SearchModel } from '../../../src/models/search.mjs';
import { SearchQueryModel } from '../../../src/models/searchquery.mjs';
import { PiwikModel } from '../../../src/models/piwik.mjs';

describe('ModelService', function () {
    let service: ModelService;

    before(async function () {
        await container.dispose();
        initializeContainer();
        mockKnex.mock(container.resolve('db'));
        service = container.resolve('modelService');
    });

    after(function () {
        return container.dispose();
    });

    afterEach(function () {
        mockKnex.getTracker().uninstall();
    });

    describe('#transaction', function () {
        it('should start a transaction', async function () {
            const tracker = mockKnex.getTracker();
            let lastStep = 0;
            let isTrx: boolean | undefined;
            tracker.on('query', (query, step) => {
                lastStep = step;
                expect(step).to.be.lessThanOrEqual(5);
                expect(query.transacting).to.be.true;
                switch (step) {
                    case 1:
                        expect(query.method).to.be.undefined;
                        expect(query.sql).to.equal('BEGIN;');
                        break;

                    case 2:
                        expect(query.method).to.equal('first');
                        expect(query.sql).to.contain(PiwikModel.tableName);
                        break;

                    case 3:
                        expect(query.method).to.equal('first');
                        expect(query.sql).to.contain(SearchQueryModel.tableName);
                        break;

                    case 4:
                        expect(query.method).to.equal('insert');
                        expect(query.sql).to.contain(SearchModel.tableName);
                        break;

                    case 5:
                        expect(query.method).to.be.undefined;
                        expect(query.sql).to.equal('COMMIT;');
                        break;

                    /* no default */
                }

                query.response([]);
            });
            tracker.install();

            await service.transaction(async (trx, models) => {
                isTrx = trx.isTransaction;
                await models.piwik.byCode('0123456789abcdef');
                await models.searchQuery.find({
                    name: '',
                    dob: '',
                    country: '',
                    address: '',
                    phone: '',
                    description: '',
                });
                await models.search.insert({
                    search_id: 0,
                    source_id: 0,
                    dt: 0,
                    ipaddr: Buffer.from('\0\0\0\0'),
                    loc_id: null,
                    piwik_id: null,
                });
            });

            expect(isTrx).to.be.true;
            expect(lastStep).to.equal(5);
        });

        it('should support read-only transactions', async function () {
            const tracker = mockKnex.getTracker();
            let lastStep = 0;
            let isTrx: boolean | undefined;
            tracker.on('query', (query, step) => {
                lastStep = step;
                expect(query.transacting).to.be.true;
                switch (step) {
                    case 1:
                        expect(query.method).to.be.undefined;
                        expect(query.sql).to.equal('SET TRANSACTION READ ONLY;');
                        break;

                    case 2:
                        expect(query.method).to.be.undefined;
                        expect(query.sql).to.equal('BEGIN;');
                        break;

                    case 3:
                        expect(query.method).to.be.undefined;
                        expect(query.sql).to.equal('COMMIT;');
                        break;

                    /* no default */
                }

                query.response([]);
            });
            tracker.install();

            await service.transaction(
                (trx) => {
                    isTrx = trx.isTransaction;
                    return Promise.resolve();
                },
                { readOnly: true },
            );

            expect(isTrx).to.be.true;
            expect(lastStep).to.equal(3);
        });
    });
});
