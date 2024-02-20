import type { Knex } from 'knex';
import { PiwikModel } from '../../src/models/piwik.mjs';

export async function up(knex: Knex): Promise<void> {
    const exists = await knex.schema.hasTable(PiwikModel.tableName);
    if (!exists) {
        await knex.schema.createTable(PiwikModel.tableName, function (table): void {
            table.bigIncrements('id').unsigned().notNullable();
            table.string('code', 16).notNullable();
            table.unique(['code']);
        });
    }
}

export function down(knex: Knex): Promise<unknown> {
    return knex.schema.dropTableIfExists(PiwikModel.tableName);
}
