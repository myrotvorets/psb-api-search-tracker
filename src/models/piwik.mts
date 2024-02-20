import type { Knex } from 'knex';

export interface Piwik {
    id: number;
    code: string;
}

interface ModelOptions {
    db: Knex.Transaction;
}

export class PiwikModel {
    public static readonly tableName = 'piwik';

    private readonly db: Knex.Transaction;

    public constructor({ db }: ModelOptions) {
        this.db = db;
    }

    public byCode(code: string): Promise<Pick<Piwik, 'id'> | undefined> {
        return this.db(PiwikModel.tableName).first('id').where('code', code).forShare();
    }

    public insert({ code }: Omit<Piwik, 'id'>): Promise<number[]> {
        return this.db(PiwikModel.tableName).insert({ code });
    }
}

declare module 'knex/types/tables.js' {
    interface Tables {
        [PiwikModel.tableName]: Knex.CompositeTableType<Piwik, Omit<Piwik, 'id'>, never, never>;
    }
}
