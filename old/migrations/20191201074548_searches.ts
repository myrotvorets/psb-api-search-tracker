/* istanbul ignore file */

import Knex from 'knex';

export async function up(knex: Knex): Promise<any> {
    await knex.schema.createTable('ukr_searches', function (table: Knex.CreateTableBuilder): void {
        table.bigIncrements('id').unsigned();
        table.bigInteger('search_id').unsigned().notNullable();
        table.integer('source_id').unsigned().notNullable();
        table.integer('dt').unsigned().notNullable();
        table.binary('ipaddr', 16).notNullable();
        table.integer('loc_id').nullable();
        table.integer('piwik_id').unsigned().nullable();

        table.foreign('search_id').references('ukr_search_queries.id').onUpdate('CASCADE').onDelete('CASCADE');

        table.foreign('loc_id').references('ukr_locations.id').onUpdate('CASCADE').onDelete('SET NULL');

        table.foreign('piwik_id').references('ukr_piwik.id').onUpdate('CASCADE').onDelete('SET NULL');
    });
}

export async function down(knex: Knex): Promise<any> {
    await knex.schema.dropTableIfExists('ukr_searches');
}
