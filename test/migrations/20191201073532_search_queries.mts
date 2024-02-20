import type { Knex } from 'knex';
import { SearchQueryModel } from '../../src/models/searchquery.mjs';

export async function up(knex: Knex): Promise<void> {
    const table = SearchQueryModel.tableName;
    const exists = await knex.schema.hasTable(table);
    if (!exists) {
        if ((knex.client as Knex.Client).driverName.includes('sqlite')) {
            await knex.schema.createTable(table, function (table): void {
                table.bigIncrements('id');
                table.string('name', 255).notNullable();
                table.string('dob', 10).notNullable();
                table.string('country', 64).notNullable();
                table.string('address', 255).notNullable();
                table.string('phone', 64).notNullable();
                table.string('description', 8192).notNullable();
                table.unique(['name', 'dob', 'country', 'address', 'phone', 'description']);
            });
        } else {
            await knex.raw(`CREATE TABLE ${table} (
                id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
                name varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL,
                dob varchar(12) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL,
                country varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL,
                address varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL,
                phone varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL,
                description varchar(8192) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL,
                name_hash int(10) unsigned AS (crc32(lcase(name))) STORED,
                dob_hash int(10) unsigned AS (crc32(lcase(dob))) STORED,
                country_hash int(10) unsigned AS (crc32(lcase(country))) STORED,
                address_hash int(10) unsigned AS (crc32(lcase(address))) STORED,
                phone_hash int(10) unsigned AS (crc32(lcase(phone))) STORED,
                description_hash int(10) unsigned AS (crc32(lcase(description))) STORED,
                PRIMARY KEY (id),
                KEY (name_hash, dob_hash, country_hash, address_hash, phone_hash, description_hash)
            )`);
        }
    }
}

export function down(knex: Knex): Promise<unknown> {
    return knex.schema.dropTableIfExists(SearchQueryModel.tableName);
}
