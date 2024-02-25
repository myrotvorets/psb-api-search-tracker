const env = { ...process.env };

if (!process.env['RUN_INTEGRATION_TESTS']) {
    process.env = {
        NODE_ENV: 'test',
        OTEL_SDK_DISABLED: 'true',
        KNEX_DATABASE_DRIVER: 'mysql2',
        KNEX_DATABASE_NAME: 'fake',
    };
}

/** @type {import('mocha').RootHookObject} */
export const mochaHooks = {
    afterAll() {
        process.env = { ...env };
    },
};
