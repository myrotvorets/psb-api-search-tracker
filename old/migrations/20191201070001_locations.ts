/* istanbul ignore file */

import Knex from 'knex';

export async function up(knex: Knex): Promise<any> {
    await knex.schema.createTable('ukr_locations', function (table: Knex.CreateTableBuilder): void {
        table.bigIncrements('id');
        table.string('country', 255).notNullable();
        table.string('city', 10).notNullable();
        table.unique(['country', 'city']);
    });
}

export async function down(knex: Knex): Promise<any> {
    await knex.schema.dropTableIfExists('ukr_locations');
}
