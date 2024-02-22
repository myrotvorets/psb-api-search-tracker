import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanEnv, num, str } from 'envalid';
import type { Knex } from 'knex';

interface DbEnv {
    NODE_ENV: string;
    KNEX_DRIVER: string;
    KNEX_DATABASE: string;
    KNEX_HOST: string;
    KNEX_USER: string;
    KNEX_PASSWORD: string;
    KNEX_CONN_LIMIT: number;
}

function getEnvironment(environment: NodeJS.Dict<string>): Readonly<DbEnv> {
    return cleanEnv(environment, {
        NODE_ENV: str({ default: 'development' }),
        KNEX_DRIVER: str({ default: 'mysql2', choices: ['mysql2'] }), // Run `npm i driver` if any other driver is needed
        KNEX_DATABASE: str(),
        KNEX_HOST: str({ default: 'localhost' }),
        KNEX_USER: str({ default: '' }),
        KNEX_PASSWORD: str({ default: '' }),
        KNEX_CONN_LIMIT: num({ default: 2 }),
    });
}

export function buildKnexConfig(environment: NodeJS.Dict<string> = process.env): Knex.Config {
    const base = dirname(fileURLToPath(import.meta.url));
    const env = getEnvironment(environment);

    const config: Knex.Config = {
        asyncStackTraces: ['development', 'test'].includes(env.NODE_ENV),
        migrations: {
            tableName: 'knex_migrations_strk',
            directory: join(base, '..', 'test', 'migrations'),
            loadExtensions: ['.mts', '.mjs'],
        },
        seeds: {
            directory: join(base, '..', 'test', 'seeds'),
            loadExtensions: ['.mts', '.mjs'],
        },
    };

    if (env.KNEX_DRIVER === 'mysql2') {
        return {
            ...config,
            client: 'mysql2',
            connection: {
                database: env.KNEX_DATABASE,
                host: env.KNEX_HOST,
                user: env.KNEX_USER,
                password: env.KNEX_PASSWORD,
                dateStrings: true,
                charset: 'utf8mb4',
            },
            pool: {
                min: 0,
                max: env.KNEX_CONN_LIMIT,
            },
        };
        /* c8 ignore start */
    }

    throw new Error(`Unsupported driver ${env.KNEX_DRIVER}`);
}
/* c8 ignore stop */
