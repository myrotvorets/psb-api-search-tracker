import type { Knex } from 'knex';
import { SearchModel } from '../../src/models/search.mjs';
import { SearchQueryModel } from '../../src/models/searchquery.mjs';
import { PiwikModel } from '../../src/models/piwik.mjs';

export async function up({ schema }: Knex): Promise<void> {
    const table = SearchModel.tableName;
    const exists = await schema.hasTable(table);
    if (!exists) {
        await schema.createTable('ukr_searches', function (table): void {
            table.bigIncrements('id').unsigned();
            table.bigInteger('search_id').unsigned().notNullable();
            table.integer('source_id').unsigned().notNullable();
            table.integer('dt').unsigned().notNullable();
            table.binary('ipaddr', 16).notNullable();
            table.integer('loc_id').unsigned().nullable();
            table.integer('piwik_id').unsigned().nullable();

            table.foreign('search_id').references(`${SearchQueryModel}.id`).onUpdate('CASCADE').onDelete('CASCADE');
            table.foreign('piwik_id').references(`${PiwikModel.tableName}.id`).onUpdate('CASCADE').onDelete('SET NULL');
        });
    }
}

export function down(knex: Knex): Promise<unknown> {
    return knex.schema.dropTableIfExists(SearchModel.tableName);
}
