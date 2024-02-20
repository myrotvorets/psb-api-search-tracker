import * as Knex from 'knex';

const seedData = [
    {
        id: -1,
        country: '',
        city: '',
    },
];

export async function seed(knex: Knex): Promise<any> {
    await knex('ukr_locations').del();
    await knex('ukr_locations').insert(seedData);
}
