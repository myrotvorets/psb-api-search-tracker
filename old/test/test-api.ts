/// <reference path="../../tap.d.ts"/>

process.env.NODE_ENV = 'test';

import tap from 'tap';
import config from 'config';
import path from 'path';
import fastify, { FastifyInstance } from 'fastify';
import { Config as KnexConfig } from 'knex';
import * as geoPlugin from 'fastify-geo-plugin';
import * as plugin from '../src/plugin';
import * as psbDbPlugin from 'fastify-psbdb-plugin';

const cfgDb = config.get<KnexConfig>('db.psb');
const cfgGeo: geoPlugin.GeoOptions = {
    geoip2: config.get<geoPlugin.GeolocatorOptions>('geoip2'),
    here: config.get<geoPlugin.GeocoderOptions>('here'),
};

let app: FastifyInstance;

function buildFastify(): FastifyInstance {
    const app = fastify();
    app.register(psbDbPlugin.plugin, { db: cfgDb });
    app.register(geoPlugin.plugin, cfgGeo);
    app.register(plugin.plugin, { prefix: '/tracker/v1' });
    return app;
}

tap.beforeEach(function (done: () => void): void {
    app = buildFastify();
    app.ready().then((): void => {
        const knex = app.psbDb;
        knex.migrate
            .latest({ directory: path.join(__dirname, '..', 'migrations') })
            .then((): Promise<any> => knex.seed.run({ directory: path.join(__dirname, '..', 'seeds') }))
            .then((): void => done());
    });
});

tap.afterEach(function (done: () => void): void {
    app.close().then((): void => {
        done();
    });
});

tap.test('Workflow', async function (t: any): Promise<void> {
    const knex = app.psbDb;

    let response = await app.inject({
        method: 'GET',
        url: '/tracker/v1/?n=Putin&ra=2.125.160.216&ff=202.196.224.0&tc=0123456789abcdef',
    });

    t.strictEqual(response.statusCode, 204);

    let row = await knex('ukr_search_queries').count('*', { as: 'cnt' });
    t.strictEqual(row?.[0]?.cnt, 1);

    let row2 = await knex('ukr_search_queries').first();
    t.deepEqual(
        {
            name: row2.name,
            dob: row2.dob,
            country: row2.country,
            address: row2.address,
            phone: row2.phone,
            description: row2.description,
        },
        { name: 'Putin', dob: '', country: '', address: '', phone: '', description: '' },
    );

    row = await knex('ukr_searches').count('*', { as: 'cnt' });
    t.strictEqual(row?.[0]?.cnt, 2);

    row = await knex('ukr_piwik').count('*', { as: 'cnt' });
    t.strictEqual(row?.[0]?.cnt, 1);

    row2 = await knex('ukr_piwik').first();
    t.strictEqual(row2?.code, '0123456789abcdef');

    row = await knex('ukr_locations').count('*', { as: 'cnt' });
    t.strictEqual(row?.[0]?.cnt, 3);
    row2 = await knex('ukr_locations').where('id', -1);
    t.deepEqual(row2, [{ id: -1, country: '', city: '' }]);
    row2 = await knex('ukr_locations').where('id', 2655045);
    t.deepEqual(row2, [{ id: 2655045, country: 'United Kingdom', city: 'Boxford' }]);
    row2 = await knex('ukr_locations').where('id', 6252001);
    t.deepEqual(row2, [{ id: 6252001, country: 'United States', city: '' }]);

    // -----------------------------

    response = await app.inject({
        method: 'GET',
        url: '/tracker/v1/?n=Putin&ra=2.125.160.216&tc=0123456789abcdef',
    });

    t.strictEqual(response.statusCode, 204);

    row = await knex('ukr_search_queries').count('*', { as: 'cnt' });
    t.strictEqual(row?.[0]?.cnt, 1);

    row = await knex('ukr_searches').count('*', { as: 'cnt' });
    t.strictEqual(row?.[0]?.cnt, 3);

    row = await knex('ukr_piwik').count('*', { as: 'cnt' });
    t.strictEqual(row?.[0]?.cnt, 1);

    row = await knex('ukr_locations').count('*', { as: 'cnt' });
    t.strictEqual(row?.[0]?.cnt, 3);

    // -----------------------------

    response = await app.inject({
        method: 'GET',
        url: '/tracker/v1/?n=Putin&ra=126.126.0.1',
    });

    t.strictEqual(response.statusCode, 204);

    row = await knex('ukr_search_queries').count('*', { as: 'cnt' });
    t.strictEqual(row?.[0]?.cnt, 1);

    row = await knex('ukr_searches').count('*', { as: 'cnt' });
    t.strictEqual(row?.[0]?.cnt, 4);
    row = await knex('ukr_searches').count('*', { as: 'cnt' }).where('loc_id', 'IS', null);
    t.strictEqual(row?.[0]?.cnt, 1);

    row = await knex('ukr_piwik').count('*', { as: 'cnt' });
    t.strictEqual(row?.[0]?.cnt, 1);

    row = await knex('ukr_locations').count('*', { as: 'cnt' });
    t.strictEqual(row?.[0]?.cnt, 3);

    // -----------------------------

    response = await app.inject({
        method: 'GET',
        url: '/tracker/v1/?n=%D0%BF%D1%83%D1%82%D0%B8%D0%BD-%D1%85%D1%83%D0%B9%D0%BB%D0%BE&ra=126.126.0.1',
    });

    t.strictEqual(response.statusCode, 204);

    row = await knex('ukr_search_queries').count('*', { as: 'cnt' });
    t.strictEqual(row?.[0]?.cnt, 1);

    row = await knex('ukr_searches').count('*', { as: 'cnt' });
    t.strictEqual(row?.[0]?.cnt, 4);
    row = await knex('ukr_searches').count('*', { as: 'cnt' }).where('loc_id', 'IS', null);
    t.strictEqual(row?.[0]?.cnt, 1);

    row = await knex('ukr_piwik').count('*', { as: 'cnt' });
    t.strictEqual(row?.[0]?.cnt, 1);

    row = await knex('ukr_locations').count('*', { as: 'cnt' });
    t.strictEqual(row?.[0]?.cnt, 3);

    // -----------------------------

    response = await app.inject({
        method: 'GET',
        url: '/tracker/v1/',
    });

    t.strictEqual(response.statusCode, 422);

    row = await knex('ukr_search_queries').count('*', { as: 'cnt' });
    t.strictEqual(row?.[0]?.cnt, 1);

    row = await knex('ukr_searches').count('*', { as: 'cnt' });
    t.strictEqual(row?.[0]?.cnt, 4);
    row = await knex('ukr_searches').count('*', { as: 'cnt' }).where('loc_id', 'IS', null);
    t.strictEqual(row?.[0]?.cnt, 1);

    row = await knex('ukr_piwik').count('*', { as: 'cnt' });
    t.strictEqual(row?.[0]?.cnt, 1);

    row = await knex('ukr_locations').count('*', { as: 'cnt' });
    t.strictEqual(row?.[0]?.cnt, 3);

    t.end();
});
