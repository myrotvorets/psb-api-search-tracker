import { isIP } from 'node:net';

function isPrivateIP(ip: string): boolean {
    if (!isIP(ip)) {
        throw new TypeError('Invalid IP address');
    }

    return (
        /^(?:::ffff:)?10\.\d\.\d\.\d$/iu.test(ip) ||
        /^(?:::ffff:)?192\.168\.\d\.\d$/iu.test(ip) ||
        /^(?:::ffff:)?172\.(?:1[6-9]|2[0-9]|3[01])\.\d\.\d$/iu.test(ip) ||
        /^(?:::ffff:)?127\.\d\.\d\.\d$/iu.test(ip) ||
        /^(?:::ffff:)?169\.254\.\d\.\d$/iu.test(ip) ||
        /^f[cd][0-9a-f]{2}:/iu.test(ip) ||
        /^fe80:/iu.test(ip) ||
        /^::1?$/iu.test(ip)
    );
}

export function isValidIP(ip: string): boolean {
    return isIP(ip) !== 0;
}

export function isPiwikCode(s: string): boolean {
    return /^[0-9a-f]{16}$/u.test(s);
}

export function isGoodIP(s: string): boolean {
    return isValidIP(s) && !isPrivateIP(s);
}
