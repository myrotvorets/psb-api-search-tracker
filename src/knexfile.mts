import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanEnv, num, str } from 'envalid';
import type { Knex } from 'knex';

interface DbEnv {
    NODE_ENV: string;
    KNEX_DATABASE_DRIVER: string;
    KNEX_DATABASE_NAME: string;
    KNEX_DATABASE_HOST: string;
    KNEX_DATABASE_USER: string;
    KNEX_DATABASE_PASSWORD: string;
    KNEX_DATABASE_CONN_LIMIT: number;
}

interface ManticoreEnv {
    NODE_ENV: string;
    KNEX_MANTICORE_DRIVER: string;
    KNEX_MANTICORE_HOST: string;
    KNEX_MANTICORE_CONN_LIMIT: number;
}

function getDatabaseEnvironment(environment: NodeJS.Dict<string>): Readonly<DbEnv> {
    return cleanEnv(environment, {
        NODE_ENV: str({ default: 'development' }),
        KNEX_DATABASE_DRIVER: str({ default: 'mysql2', choices: ['mysql2'] }), // Run `npm i driver` if any other driver is needed
        KNEX_DATABASE_NAME: str(),
        KNEX_DATABASE_HOST: str({ default: 'localhost' }),
        KNEX_DATABASE_USER: str({ default: '' }),
        KNEX_DATABASE_PASSWORD: str({ default: '' }),
        KNEX_DATABASE_CONN_LIMIT: num({ default: 2 }),
    });
}

function getManticoreEnvironment(environment: NodeJS.Dict<string>): Readonly<ManticoreEnv> {
    return cleanEnv(environment, {
        NODE_ENV: str({ default: 'development' }),
        KNEX_MANTICORE_DRIVER: str({ default: '', choices: ['', 'mysql2'] }),
        KNEX_MANTICORE_HOST: str({ default: '' }),
        KNEX_MANTICORE_CONN_LIMIT: num({ default: 2 }),
    });
}

export function buildKnexDatabaseConfig(environment: NodeJS.Dict<string> = process.env): Knex.Config {
    const base = dirname(fileURLToPath(import.meta.url));
    const env = getDatabaseEnvironment(environment);

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

    if (env.KNEX_DATABASE_DRIVER === 'mysql2') {
        return {
            ...config,
            client: 'mysql2',
            connection: {
                database: env.KNEX_DATABASE_NAME,
                host: env.KNEX_DATABASE_HOST,
                user: env.KNEX_DATABASE_USER,
                password: env.KNEX_DATABASE_PASSWORD,
                dateStrings: true,
                charset: 'utf8mb4',
            },
            pool: {
                min: 0,
                max: env.KNEX_DATABASE_CONN_LIMIT,
            },
        };
        /* c8 ignore start */
    }

    throw new Error(`Unsupported driver ${env.KNEX_DATABASE_DRIVER}`);
}
/* c8 ignore stop */

export function buildKnexManticoreConfig(environment: NodeJS.Dict<string> = process.env): Knex.Config | null {
    const env = getManticoreEnvironment(environment);

    if (!env.KNEX_MANTICORE_DRIVER || !env.KNEX_MANTICORE_HOST) {
        return null;
    }

    const config: Knex.Config = {
        asyncStackTraces: ['development', 'test'].includes(env.NODE_ENV),
        pool: {
            min: 0,
            max: env.KNEX_MANTICORE_CONN_LIMIT,
        },
    };

    if (env.KNEX_MANTICORE_DRIVER === 'mysql2') {
        return {
            ...config,
            client: 'mysql2',
            connection: {
                database: '',
                host: env.KNEX_MANTICORE_HOST,
                user: '',
                password: '',
                dateStrings: true,
                charset: 'utf8mb4',
            },
        };
        /* c8 ignore start */
    }

    throw new Error(`Unsupported driver ${env.KNEX_MANTICORE_DRIVER}`);
}
/* c8 ignore stop */
