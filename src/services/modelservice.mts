import type { Knex } from 'knex';
import { SearchModel } from '../models/search.mjs';
import { SearchQueryModel } from '../models/searchquery.mjs';

interface ModelServiceOptions {
    db: Knex;
}

export interface Models {
    search: SearchModel;
    searchQuery: SearchQueryModel;
}

export class ModelService {
    private readonly _db: Knex;

    public constructor({ db }: ModelServiceOptions) {
        this._db = db;
    }

    public transaction<T = unknown>(
        callback: (trx: Knex.Transaction, models: Models) => void | Promise<T>, // eslint-disable-line @typescript-eslint/no-invalid-void-type
        config?: Knex.TransactionConfig,
    ): Promise<T> {
        return this._db.transaction<T>((trx) => {
            const models: Models = {
                search: new SearchModel({ db: trx }),
                searchQuery: new SearchQueryModel({ db: trx }),
            };

            return callback(trx, models);
        }, config);
    }
}
