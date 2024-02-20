import type { Knex } from 'knex';

export interface Search {
    search_id: number;
    source_id: number;
    dt: number;
    ipaddr: Buffer;
    loc_id: number | null;
    piwik_id: number | null;
}

interface ModelOptions {
    db: Knex.Transaction;
}

export class SearchModel {
    public static readonly tableName = 'searches';

    private readonly db: Knex.Transaction;

    public constructor({ db }: ModelOptions) {
        this.db = db;
    }

    public insert(data: Search): Promise<number[]> {
        return this.db(SearchModel.tableName).insert({ ...data });
    }
}

declare module 'knex/types/tables.js' {
    interface Tables {
        [SearchModel.tableName]: Knex.CompositeTableType<Search, Search, never, never>;
    }
}
