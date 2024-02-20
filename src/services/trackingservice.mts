import { inet_pton } from 'inet_xtoy';
import { isGoodIP, isPiwikCode } from '../lib/validators.mjs';
import { SearchParams, TrackingInfo, TrackingServiceInterface } from './trackingserviceinterface.mjs';
import { ModelService } from './modelservice.mjs';
import { PiwikModel } from '../models/piwik.mjs';
import { SearchQueryModel } from '../models/searchquery.mjs';
import { SearchModel } from '../models/search.mjs';

export interface TrackingServiceOptions {
    modelService: ModelService;
}

export class TrackingService implements TrackingServiceInterface {
    private readonly _model: ModelService;

    public constructor({ modelService }: TrackingServiceOptions) {
        this._model = modelService;
    }

    public track(
        params: SearchParams,
        { remoteAddress, forwardedFor, piwikCode, locationID }: TrackingInfo,
        sourceID: number,
    ): Promise<void> {
        if (!params.name && !params.dob && !params.country && !params.address && !params.phone && !params.description) {
            return Promise.resolve();
        }

        return this._model.transaction(async (_trx, { piwik, search, searchQuery }) => {
            const piwikID = isPiwikCode(piwikCode) ? await this.getPiwikID(piwik, piwikCode) : null;
            const searchID = await this.getSearchID(searchQuery, params);
            const ips = this.getIPs(remoteAddress, forwardedFor);
            for (const ip of ips) {
                // eslint-disable-next-line no-await-in-loop
                await this.doTrack(search, ip, locationID, piwikID, searchID, sourceID);
            }
        });
    }

    protected getIPs(requestAddress: string, forwardedFor: string): string[] {
        const ff = forwardedFor.split(',').map((s) => s.trim());
        return [...new Set([requestAddress, ...ff])].filter((ip) => isGoodIP(ip));
    }

    protected async getPiwikID(model: PiwikModel, code: string): Promise<number | null> {
        const row = await model.byCode(code);
        if (!row) {
            const res = await model.insert({ code });
            return res[0]!;
        }

        return row.id;
    }

    protected async getSearchID(model: SearchQueryModel, params: SearchParams): Promise<number> {
        const row = await model.find(params);
        if (!row) {
            const res = await model.insert(params);
            return res[0]!;
        }

        return row.id;
    }

    protected async doTrack(
        searchModel: SearchModel,
        ip: string,
        locationID: number | null,
        piwikID: number | null,
        searchID: number,
        sourceID: number,
    ): Promise<unknown> {
        return searchModel.insert({
            search_id: searchID,
            source_id: sourceID,
            dt: Math.floor(Date.now() / 1000),
            ipaddr: inet_pton(ip),
            loc_id: locationID,
            piwik_id: piwikID,
        });
    }
}
