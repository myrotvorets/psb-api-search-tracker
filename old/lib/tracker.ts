import { ServerResponse } from 'http';
import { FastifyRequest, FastifyReply } from 'fastify';
import { GeoLocator } from 'geolocator';
import knex from 'knex';
import { isLoopback, isPublic } from 'ip';
import { inet_pton } from 'inet_xtoy';
import { sanitizeName, sanitizeDOB, sanitizeCountry, sanitizeAddress, sanitizePhone } from '../utils/sanitizers';

type Request = FastifyRequest;
type Response = FastifyReply<ServerResponse>;

export class Tracker {
    private gl: GeoLocator;
    private db: knex;

    public constructor(gl: GeoLocator, db: knex) {
        this.gl = gl;
        this.db = db;
    }

    public track(req: Request, res: Response): void {
        let name: string = (req.query.n || '').trim();
        let dob: string = (req.query.b || '').trim();
        let country: string = (req.query.c || '').trim();
        let address: string = (req.query.a || '').trim();
        let phone: string = (req.query.p || '').trim();
        const desc: string = (req.query.d || '').trim();
        const ra: string = (req.query.ra || '0.0.0.0').trim();
        const ff: string = (req.query.ff || '').trim();
        const tc: string = (req.query.tc || '').trim();

        /*
         * If we run tests, we need to return a response once all processing is done.
         * Failure to do so will result in unfinished tests because afterEach callback
         * will fail to finish
         */
        /* istanbul ignore if */
        if (process.env.NODE_ENV !== 'test') {
            res.status(204).send();
        }

        setImmediate(
            async (): Promise<void> => {
                name = sanitizeName(name);
                dob = sanitizeDOB(dob);
                country = sanitizeCountry(country);
                address = sanitizeAddress(address);
                phone = sanitizePhone(phone);

                try {
                    await this.db.transaction(
                        async (trx: knex.Transaction): Promise<void> => {
                            if (!name && !dob && !country && !address && !phone && !desc) {
                                return;
                            }

                            const piwikID: number | null =
                                tc && /^[0-9a-f]{16}$/.test(tc) ? await this.getPiwikID(trx, tc) : null;
                            const searchID: number = await this.getSearchID(
                                trx,
                                name,
                                dob,
                                country,
                                address,
                                phone,
                                desc,
                            );
                            const ips: string[] = this._getIPs(ra, ff);
                            for (const ip of ips) {
                                await this._doTrack(trx, ip, piwikID, searchID);
                            }
                        },
                    );
                } catch (e) {
                    console.error(e);
                }

                /* istanbul ignore else */
                if (process.env.NODE_ENV === 'test') {
                    res.status(204).send();
                }
            },
        );
    }

    private _getIPs(ra: string, ff: string): string[] {
        return [...new Set([ra, ...ff.split(',').map((s): string => s.trim())])].filter(
            (addr: string): boolean => GeoLocator.isValidIP(addr) && isPublic(addr) && !isLoopback(addr),
        );
    }

    private async getPiwikID(trx: knex.Transaction, tc: string): Promise<number | null> {
        try {
            const row = await trx('ukr_piwik').first('id').where('code', tc).forShare();

            if (!row) {
                const id = await trx('ukr_piwik').insert({ code: tc });
                return id[0];
            }

            return row.id;
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    private async getLocationID(
        trx: knex.Transaction,
        country: string,
        city: string,
        locid: number | null,
    ): Promise<number | null> {
        let id: number | null = null;
        try {
            if (country) {
                /* istanbul ignore if - cannot test this branch because with maxmind country !== '' if loc_id !== null */
                if (locid === null) {
                    const row = await trx('ukr_locations').first('id').where({ country, city }).forShare();

                    if (!row) {
                        const row = await trx('ukr_locations').min({ id: 'id' });
                        id = row ? row[0].id - 1 : -1;
                        await trx('ukr_locations').insert({ id, country, city });
                    } else {
                        id = row.id;
                    }
                } else {
                    const row = await trx('ukr_locations').first('id').where('id', locid).forShare();

                    if (!row) {
                        const res = await trx('ukr_locations').insert({ id: locid, country, city });
                        id = res[0];
                    } else {
                        id = row.id;
                    }
                }
            }
        } catch (e) {
            console.error(e);
            id = null;
        }

        return id;
    }

    private async getSearchID(
        trx: knex.Transaction,
        name: string,
        dob: string,
        country: string,
        address: string,
        phone: string,
        description: string,
    ): Promise<number> {
        const driver = this.db.client.driverName + '';
        let row: undefined | { id: number };
        /* istanbul ignore if */
        if (/^mysql|mariadb/.test(driver)) {
            row = await trx('ukr_search_queries')
                .first('id')
                .where({ name, dob, country, address, phone, description })
                .andWhereRaw('name_hash = CRC32(LOWER(?))', name)
                .andWhereRaw('dob_hash = CRC32(LOWER(?))', dob)
                .andWhereRaw('country_hash = CRC32(LOWER(?))', country)
                .andWhereRaw('address_hash = CRC32(LOWER(?))', address)
                .andWhereRaw('phone_hash = CRC32(LOWER(?))', phone)
                .andWhereRaw('description_hash = CRC32(LOWER(?))', description);
        } else {
            row = await trx('ukr_search_queries')
                .first('id')
                .where({ name, dob, country, address, phone, description });
        }

        if (!row) {
            const res = await trx('ukr_search_queries').insert({ name, dob, country, address, phone, description });
            return res[0];
        }

        return row.id;
    }

    private async _doTrack(trx: knex.Transaction, ip: string, piwikID: number | null, searchID: number): Promise<void> {
        const [geocity] = await this.gl.geolocateEx(ip);
        const locationID = await this.getLocationID(trx, geocity.country || '', geocity.city || '', geocity.id);
        await trx('ukr_searches').insert({
            search_id: searchID,
            source_id: 1,
            dt: Math.floor(Date.now() / 1000),
            ipaddr: inet_pton(ip),
            loc_id: locationID,
            piwik_id: piwikID,
        });

        return;
    }
}
