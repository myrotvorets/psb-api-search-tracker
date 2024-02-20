export interface SearchParams {
    name: string;
    dob: string;
    country: string;
    address: string;
    phone: string;
    description: string;
}

export interface TrackingInfo {
    remoteAddress: string;
    forwardedFor: string;
    piwikCode: string;
    locationID: number;
}

export interface TrackingServiceInterface {
    track(params: SearchParams, info: TrackingInfo, sourceID: number): Promise<void>;
}
