import type { Knex } from 'knex';

export interface SearchQueryData {
    name: string;
    dob: string;
    country: string;
    address: string;
    phone: string;
    description: string;
}

export interface SearchQuery extends SearchQueryData {
    id: number;
}

interface ModelOptions {
    db: Knex.Transaction;
}

export class SearchQueryModel {
    public static readonly tableName = 'ukr_search_queries';

    private readonly db: Knex.Transaction;
    private readonly driverName: string;

    public constructor({ db }: ModelOptions) {
        this.db = db;
        this.driverName = (this.db.client as Knex.Client).driverName;
    }

    public find({
        name,
        dob,
        country,
        address,
        phone,
        description,
    }: SearchQueryData): Promise<Pick<SearchQuery, 'id'> | undefined> {
        if (/^(mysql|mariadb)/u.test(this.driverName)) {
            return this.db(SearchQueryModel.tableName)
                .first('id')
                .where({ name, dob, country, address, phone, description })
                .andWhereRaw('name_hash = CRC32(LOWER(?))', name)
                .andWhereRaw('dob_hash = CRC32(LOWER(?))', dob)
                .andWhereRaw('country_hash = CRC32(LOWER(?))', country)
                .andWhereRaw('address_hash = CRC32(LOWER(?))', address)
                .andWhereRaw('phone_hash = CRC32(LOWER(?))', phone)
                .andWhereRaw('description_hash = CRC32(LOWER(?))', description)
                .forShare();
        }

        return this.db(SearchQueryModel.tableName)
            .first('id')
            .where({ name, dob, country, address, phone, description })
            .forShare();
    }

    public insert({ name, dob, country, address, phone, description }: SearchQueryData): Promise<number[]> {
        return this.db(SearchQueryModel.tableName).insert({
            name,
            dob,
            country,
            address,
            phone,
            description,
        });
    }
}

declare module 'knex/types/tables.js' {
    interface Tables {
        [SearchQueryModel.tableName]: Knex.CompositeTableType<SearchQuery, SearchQueryData, never, never>;
    }
}
