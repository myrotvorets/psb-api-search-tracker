import { type Request, type Response, Router } from 'express';
import { asyncWrapperMiddleware } from '@myrotvorets/express-async-middleware-wrapper';
import type { LocalsWithContainer } from '../lib/container.mjs';

interface TrackingRequestBody {
    name: string;
    dob: string;
    country: string;
    address: string;
    phone: string;
    desc: string;
    ra: string;
    ff: string;
    tc: string;
    loc: number;
    src: number;
}

async function trackHandler(
    req: Request<never, never, TrackingRequestBody, never, LocalsWithContainer>,
    res: Response<never, LocalsWithContainer>,
): Promise<void> {
    const { name, dob, country, address, phone, desc, ra, ff, tc, loc, src } = req.body;
    const trackService = res.locals.container.resolve('trackService');
    await trackService.track(
        {
            name,
            dob,
            country,
            address,
            phone,
            description: desc,
        },
        {
            remoteAddress: ra,
            forwardedFor: ff,
            piwikCode: tc,
            locationID: loc,
        },
        src,
    );
    res.status(204).send();
}

export function trackController(): Router {
    const router = Router();
    router.post('/track', asyncWrapperMiddleware(trackHandler));
    return router;
}
