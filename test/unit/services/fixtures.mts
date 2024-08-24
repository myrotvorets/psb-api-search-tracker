/* eslint-disable sonarjs/no-hardcoded-ip */
import type { SearchParams, TrackingInfo } from '../../../src/services/trackingserviceinterface.mjs';
import { SearchModel } from '../../../src/models/search.mjs';
import { SearchQueryModel } from '../../../src/models/searchquery.mjs';

export const piwikCode = '0123456789abcdef';

export const emptySearchParams: SearchParams = {
    name: '',
    dob: '',
    country: '',
    address: '',
    phone: '',
    description: '',
};

export const dummySearchParams: SearchParams = {
    ...emptySearchParams,
    name: 'John Doe',
};

export const dummyTrackingInfo: TrackingInfo = {
    remoteAddress: '1.2.3.4',
    forwardedFor: '',
    piwikCode: '',
    locationID: 1,
};

interface ResponseFixture {
    method: string | undefined;
    sql: RegExp;
    bindings: unknown[] | undefined;
    response: unknown[];
}

export const newData: ResponseFixture[] = [
    { method: undefined, sql: /^/iu, bindings: undefined, response: [] },
    {
        method: undefined,
        sql: /BEGIN/iu,
        bindings: undefined,
        response: [],
    },
    {
        method: 'first',
        sql: new RegExp(`^select \`id\` from \`${SearchQueryModel.tableName}\` where`, 'iu'),
        bindings: ['John Doe', '', '', '', '', '', 'John Doe', '', '', '', '', '', 1],
        response: [],
    },
    {
        method: 'insert',
        sql: new RegExp(`^insert into \`${SearchQueryModel.tableName}\``, 'iu'),
        bindings: ['', '', '', '', 'John Doe', ''],
        response: [1],
    },
    {
        method: 'insert',
        sql: new RegExp(`^insert into \`${SearchModel.tableName}\``, 'iu'),
        bindings: [2, Buffer.from('\x01\x02\x03\x04', 'ascii'), 1, piwikCode, 1, 0],
        response: [1],
    },
    {
        method: undefined,
        sql: /COMMIT/iu,
        bindings: undefined,
        response: [],
    },
];

export const existingData: ResponseFixture[] = [
    { method: undefined, sql: /^/iu, bindings: undefined, response: [] },
    {
        method: undefined,
        sql: /BEGIN/iu,
        bindings: undefined,
        response: [],
    },
    {
        method: 'first',
        sql: new RegExp(`^select \`id\` from \`${SearchQueryModel.tableName}\` where`, 'iu'),
        bindings: ['John Doe', '', '', '', '', '', 'John Doe', '', '', '', '', '', 1],
        response: [{ id: 1 }],
    },
    {
        method: 'insert',
        sql: new RegExp(`^insert into \`${SearchModel.tableName}\``, 'iu'),
        bindings: [2, Buffer.from('\x01\x02\x03\x04', 'ascii'), 1, piwikCode, 1, 0],
        response: [1],
    },
    {
        method: undefined,
        sql: /COMMIT/iu,
        bindings: undefined,
        response: [],
    },
];

export const existingDataWithNulls: ResponseFixture[] = [
    { method: undefined, sql: /^/iu, bindings: undefined, response: [] },
    {
        method: undefined,
        sql: /BEGIN/iu,
        bindings: undefined,
        response: [],
    },
    {
        method: 'first',
        sql: new RegExp(`^select \`id\` from \`${SearchQueryModel.tableName}\` where`, 'iu'),
        bindings: ['John Doe', '', '', '', '', '', 'John Doe', '', '', '', '', '', 1],
        response: [{ id: 1 }],
    },
    {
        method: 'insert',
        sql: new RegExp(`^insert into \`${SearchModel.tableName}\``, 'iu'),
        bindings: [2, Buffer.from('\x01\x02\x03\x04', 'ascii'), null, null, 1, 0],
        response: [1],
    },
    {
        method: undefined,
        sql: /COMMIT/iu,
        bindings: undefined,
        response: [],
    },
];
