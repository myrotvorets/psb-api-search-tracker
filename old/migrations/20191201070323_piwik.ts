/* istanbul ignore file */

import Knex from 'knex';

export async function up(knex: Knex): Promise<any> {
    await knex.schema.createTable('ukr_piwik', function (table: Knex.CreateTableBuilder): void {
        table.bigIncrements('id').unsigned().notNullable();
        table.string('code', 16).notNullable();
        table.unique(['code']);
    });
}

export async function down(knex: Knex): Promise<any> {
    await knex.schema.dropTableIfExists('ukr_piwik');
}
