import { inet_pton } from 'inet_xtoy';
import { isIP } from 'node:net';

/**
 * @see https://ipgeolocation.io/resources/bogon.html
 */
function isUnroutableIPv4(val: number): boolean {
    const pairs = [
        [0xff000000, 0x00000000], // 0.0.0.0 - 0.255.255.255 - Current network
        [0xff000000, 0x0a000000], // 10.0.0.0 - 10.255.255.255 - Private network
        [0xffc00000, 0x64400000], // 100.64.0.0 - 100.127.255.255 - Carrier-grade NAT
        [0xff000000, 0x7f000000], // 127.0.0.0 - 127.255.255.255 - Loopback
        [0xffff0000, 0xa9fe0000], // 169.254.0.0 - 169.254.255.255 - Link-local
        [0xfff00000, 0xac100000], // 172.16.0.0 - 172.31.255.255 - Private network
        [0xffffff00, 0xc0000000], // 192.0.0.0 - 192.0.0.255 - IETF protocol assignments
        [0xffffff00, 0xc0000200], // 192.0.2.0 - 192.0.2.255 - TEST-NET-1
        [0xffff0000, 0xc0a80000], // 192.168.0.0 - 192.168.255.255 - Private network
        [0xfffe0000, 0xc6120000], // 198.18.0.0 - 198.19.255.255 - Network interconnect device benchmark testing
        [0xffffff00, 0xc6976400], // 198.151.100.0 - 198.151.100.255 - TEST-NET-2
        [0xffffff00, 0xcb007100], // 203.0.113.0 - 203.0.113.255 - TEST-NET-3
        [0xe0000000, 0xe0000000], // 224.0.0.0 - 239.255.255.255 - Multicast, 240.0.0.0 - 255.255.255.255 - Reserved
    ] as const;

    for (const [mask, test] of pairs) {
        if ((val & mask) >>> 0 === test) {
            return true;
        }
    }

    return false;
}

/**
 * @see https://ipgeolocation.io/resources/bogon.html
 * @see https://superuser.com/a/1363628 and https://en.wikipedia.org/wiki/IPv6_address#Special_addresses for 64:ff9b:1::/48
 */
function isUnroutableIPv6(valhi: bigint, vallo: bigint): boolean {
    // mask hi, mask lo, test hi, test lo
    const pairs = [
        [0xffffffffffffffffn, 0xffffffff00000000n, 0x0000000000000000n, 0x0000000000000000n], // ::/128 - Unspecified, ::1/128 - Loopback, ::/96 - IPv4-compatible addresses
        [0xffffffffffff0000n, 0x0000000000000000n, 0x0064ff9b00010000n, 0x0000000000000000n], // 64:ff9b:1::/48 - IPv4/IPv6 translation
        [0xffffffffffffffffn, 0x0000000000000000n, 0x0100000000000000n, 0x0000000000000000n], // 100::/64 - Discard prefix
        [0xffffffff00000000n, 0x0000000000000000n, 0x20010db800000000n, 0x0000000000000000n], // 2001:db8::/32 - Documentation
        [0xfffffff000000000n, 0xffff000000000000n, 0x2001100000000000n, 0x0000000000000000n], // 2001:10::/28 - ORCHIDv2
        [0xfe00000000000000n, 0x0000000000000000n, 0xfc00000000000000n, 0x0000000000000000n], // fc00::/7 - Unique Local Addresses
        [0xff80000000000000n, 0x0000000000000000n, 0xfe80000000000000n, 0x0000000000000000n], // fe80::/10 - Link-local addresses, fec0::/10 - SIte-local unicast
        [0xff00000000000000n, 0x0000000000000000n, 0xff00000000000000n, 0x0000000000000000n], // ff00::/8 - Multicast
        // Teredo bogons
        [0xffffffffff000000n, 0x0000000000000000n, 0x2001000000000000n, 0x0000000000000000n], // 2001::/40 - Teredo bogon (0.0.0.0/8)
        [0xffffffffff000000n, 0x0000000000000000n, 0x200100000a000000n, 0x0000000000000000n], // 2001:0:a00::/40 - Teredo bogon (10.0.0.0/8)
        [0xffffffffff000000n, 0x0000000000000000n, 0x200100007f000000n, 0x0000000000000000n], // 2001:0:7f00::/40 - Teredo bogon (127.0.0.0/8)
        [0xffffffffffff0000n, 0x0000000000000000n, 0x20010000a9fe0000n, 0x0000000000000000n], // 2001:0:a9fe::/48 - Teredo bogon (169.254.0.0/16)
        [0xfffffffffff00000n, 0x0000000000000000n, 0x20010000ac100000n, 0x0000000000000000n], // 2001:0:ac10::/44 - Teredo bogon (172.16.0.0/12)
        [0xffffffffffffff00n, 0x0000000000000000n, 0x20010000c0000000n, 0x0000000000000000n], // 2001:0:c000::/56 - Teredo bogon (192.0.0.0/24)
        [0xffffffffffffff00n, 0x0000000000000000n, 0x20010000c0000200n, 0x0000000000000000n], // 2001:0:c000:200::/56 - Teredo bogon (192.0.2.0/24)
        [0xffffffffffff0000n, 0x0000000000000000n, 0x20010000c0a80000n, 0x0000000000000000n], // 2001:0:c0a8::/48 - Teredo bogon (192.168.0.0/16)
        [0xfffffffffffe0000n, 0x0000000000000000n, 0x20010000c6120000n, 0x0000000000000000n], // 2001:0:c612::/47 - Teredo bogon (198.18.0.0/15)
        [0xffffffffffffff00n, 0x0000000000000000n, 0x20010000c6336400n, 0x0000000000000000n], // 2001:0:c633:6400::/56 - Teredo bogon (198.51.100.0/24)
        [0xffffffffffffff00n, 0x0000000000000000n, 0x20010000cb007100n, 0x0000000000000000n], // 2001:0:cb00:7100::/56 - Teredo bogon (203.0.113.0/24)
        [0xffffffffe0000000n, 0x0000000000000000n, 0x20010000e0000000n, 0x0000000000000000n], // 2001:0:e000::/35 - Teredo bogon (224.0.0.0/4, 240.0.0.0/4, 255.255.255.255/32)
        // 6to4 bogons
        [0xffffff0000000000n, 0x0000000000000000n, 0x2002000000000000n, 0x0000000000000000n], // 2002::/24 - 6to4 bogon (0.0.0.0/8)
        [0xffffff0000000000n, 0x0000000000000000n, 0x20020a0000000000n, 0x0000000000000000n], // 2002:a00::/24 - 6to4 bogon (10.0.0.0/8)
        [0xffffff0000000000n, 0x0000000000000000n, 0x20027f0000000000n, 0x0000000000000000n], // 2002:7f00::/24 - 6to4 bogon (127.0.0.0/8)
        [0xffffffff00000000n, 0x0000000000000000n, 0x2002a9fe00000000n, 0x0000000000000000n], // 2002:a9fe::/32 - 6to4 bogon (169.254.0.0/16)
        [0xfffffff000000000n, 0x0000000000000000n, 0x2002ac1000000000n, 0x0000000000000000n], // 2002:ac10::/28 - 6to4 bogon (172.16.0.0/12)
        [0xffffffffff000000n, 0x0000000000000000n, 0x2002c00000000000n, 0x0000000000000000n], // 2002:c000::/40 - 6to4 bogon (192.0.0.0/24)
        [0xffffffffff000000n, 0x0000000000000000n, 0x2002c00002000000n, 0x0000000000000000n], // 2002:c000:200::/40 - 6to4 bogon (192.0.2.0/24)
        [0xffffffff00000000n, 0x0000000000000000n, 0x2002c0a800000000n, 0x0000000000000000n], // 2002:c0a8::/32 - 6to4 bogon (192.168.0.0/16)
        [0xfffffffe00000000n, 0x0000000000000000n, 0x2002c61200000000n, 0x0000000000000000n], // 2002:c612::/31 - 6to4 bogon (198.18.0.0/15)
        [0xffffffffff000000n, 0x0000000000000000n, 0x2002c63364000000n, 0x0000000000000000n], // 2002:c633:6400::/40 - 6to4 bogon (198.51.100.0/24)
        [0xffffffffff000000n, 0x0000000000000000n, 0x2002cb0071000000n, 0x0000000000000000n], // 2002:cb00:7100::/40 - 6to4 bogon (203.0.113.0/24)
        [0xffffe00000000000n, 0x0000000000000000n, 0x2002e00000000000n, 0x0000000000000000n], // 2002:e000::/19 - 6to4 bogon (224.0.0.0/4, 240.0.0.0/4, 255.255.255.255/32)
    ] as const;

    for (const [maskhi, masklo, testhi, testlo] of pairs) {
        if ((valhi & maskhi) === testhi && (vallo & masklo) === testlo) {
            return true;
        }
    }

    // ::ffff:0.0.0.0 - ::ffff:255.255.255.255
    // ::ffff:0:0.0.0.0 - ::ffff:0:255.255.255.255
    // 64:ff9b::0.0.0.0 - 64:ff9b::255.255.255.255
    if (
        (valhi === 0x0000000000000000n &&
            ((vallo & 0xffffffff00000000n) === 0x0000ffff00000000n ||
                (vallo & 0xffff000000000000n) === 0xffff000000000000n)) ||
        (valhi === 0x0064ff9b00000000n && (vallo & 0xffffffff00000000n) === 0x0000000000000000n)
    ) {
        const ipv4 = Number(vallo & 0xffffffffn);
        return isUnroutableIPv4(ipv4);
    }

    return false;
}

function isUnroutableIP(ip: string): boolean {
    const bin = inet_pton(ip);

    /* c8 ignore start */
    if (!bin) {
        throw new TypeError('Invalid IP address');
    }
    /* c8 ignore stop */

    if (bin.length === 4) {
        return isUnroutableIPv4(bin.readUInt32BE(0));
    }

    if (bin.length === 16) {
        return isUnroutableIPv6(bin.readBigUInt64BE(0), bin.readBigUInt64BE(8));
        /* c8 ignore start */
    }

    return false;
}
/* c8 ignore stop */

export function isValidIP(ip: string): boolean {
    return isIP(ip) !== 0;
}

export function isPiwikCode(s: string): boolean {
    return /^[0-9a-f]{16}$/u.test(s);
}

export function isGoodIP(s: string): boolean {
    return isValidIP(s) && !isUnroutableIP(s);
}
