import { expect } from 'chai';
import { isGoodIP, isPiwikCode, isValidIP } from '../../../src/lib/validators.mjs';

const v4Bogons = [
    '0.0.0.0',
    '0.255.255.255',
    '10.0.0.0',
    '10.255.255.255',
    '100.64.0.0',
    '100.127.255.255',
    '127.0.0.0',
    '127.255.255.255',
    '169.254.0.0',
    '169.254.255.255',
    '172.16.0.0',
    '172.31.255.255',
    '192.0.0.0',
    '192.0.0.255',
    '192.0.2.0',
    '192.0.2.255',
    '192.168.0.0',
    '192.168.255.255',
    '198.18.0.0',
    '198.19.255.255',
    '198.151.100.0',
    '198.151.100.255',
    '203.0.113.0',
    '203.0.113.255',
    '224.0.0.0',
    '255.255.255.255',
];

const teredoBogons = [
    '2001::',
    '2001:0:ff:ffff:ffff:ffff:ffff:ffff',
    '2001:0:a00::',
    '2001:0:aff:00ff:ffff:ffff:ffff:ffff',
    '2001:0:7f00::',
    '2001:0:7fff:00ff:ffff:ffff:ffff:ffff',
    '2001:0:a9fe::',
    '2001:0:a9fe:ffff:ffff:ffff:ffff:ffff',
    '2001:0:ac10::',
    '2001:0:ac1f:ffff:ffff:ffff:ffff:ffff',
    '2001:0:c000::',
    '2001:0:c000:00ff:ffff:ffff:ffff:ffff',
    '2001:0:c000:200::',
    '2001:0:c000:200:ffff:ffff:ffff:ffff',
    '2001:0:c0a8::',
    '2001:0:c0a8:ffff:ffff:ffff:ffff:ffff',
    '2001:0:c612::',
    '2001:0:c613:ffff:ffff:ffff:ffff:ffff',
    '2001:0:c633:6400::',
    '2001:0:c633:64ff:ffff:ffff:ffff:ffff',
    '2001:0:cb00:7100::',
    '2001:0:cb00:71ff:ffff:ffff:ffff:ffff',
    '2001:0:e000::',
    '2001:0:efff:ffff:ffff:ffff:ffff:ffff',
];

const sixToFourBogons = [
    '2002::',
    '2002:ff:ffff:ffff:ffff:ffff:ffff:ffff',
    '2002:a00::',
    '2002:aff:ff:ffff:ffff:ffff:ffff:ffff',
    '2002:7f00::',
    '2002:7fff:00ff:ffff:ffff:ffff:ffff:ffff',
    '2002:a9fe::',
    '2002:a9fe:ffff:ffff:ffff:ffff:ffff:ffff',
    '2002:ac10::',
    '2002:ac1f:ffff:ffff:ffff:ffff:ffff:ffff',
    '2002:c000::',
    '2002:c000:ff:ffff:ffff:ffff:ffff:ffff',
    '2002:c000:200::',
    '2002:c000:0200:ffff:ffff:ffff:ffff:ffff',
    '2002:c0a8::',
    '2002:c0a8:ffff:ffff:ffff:ffff:ffff:ffff',
    '2002:c612::',
    '2002:c613:ffff:ffff:ffff:ffff:ffff:ffff',
    '2002:c633:6400::',
    '2002:c633:64ff:ffff:ffff:ffff:ffff:ffff',
    '2002:cb00:7100::',
    '2002:cb00:71ff:ffff:ffff:ffff:ffff:ffff',
    '2002:e000::',
    '2002:efff:ffff:ffff:ffff:ffff:ffff:ffff',
];

const ipv4Mapped = v4Bogons.map((ip) => `::ffff:${ip}`);
const ipv4TranslatedSoftware = v4Bogons.map((ip) => `::ffff:0:${ip}`);
const ipv4TranslatedGlobal = v4Bogons.map((ip) => `64:ff9b::${ip}`);

describe('Validators', function () {
    describe('isValidIP', function () {
        // eslint-disable-next-line mocha/no-setup-in-describe
        (
            [
                ['1.1.1.1', true],
                ['127.01.01.01', false],
                ['0x7F.1', false],
                ['127', false],
                ['::', true],
                ['1::1', true],
                ['::127.0.0.1', true],
                ['::fffff', false],
                ['', false],
                [' 127.0.0.1', false],
            ] as const
        ).forEach(([ip, expected]) => {
            it(`should return ${expected} for '${ip}'`, function () {
                const result = isValidIP(ip);
                expect(result).to.equal(expected);
            });
        });
    });

    describe('isPiwikCode', function () {
        // eslint-disable-next-line mocha/no-setup-in-describe
        (
            [
                ['', false],
                ['0000000000000000', true],
                ['000000000000000', false],
                ['00000000000000000', false],
                ['0123456789abcdef', true],
                ['0123456789ABCDEF', false],
                ['0123456789abcdfg', false],
            ] as const
        ).forEach(([code, expected]) => {
            it(`should return ${expected} for '${code}'`, function () {
                const result = isPiwikCode(code);
                expect(result).to.equal(expected);
            });
        });
    });

    describe('isGoodIP', function () {
        it('should return false for an invalid IP', function () {
            const ip = '256.0.0.1';
            expect(isGoodIP(ip)).to.be.false;
        });

        // eslint-disable-next-line mocha/no-setup-in-describe
        v4Bogons.forEach((ip) => {
            it(`should return false for a bogon IPv4 '${ip}'`, function () {
                expect(isValidIP(ip)).to.be.true;
                expect(isGoodIP(ip)).to.be.false;
            });
        });

        // eslint-disable-next-line mocha/no-setup-in-describe
        [...ipv4Mapped, ...ipv4TranslatedSoftware, ...ipv4TranslatedGlobal].forEach((ip) => {
            it(`should return false for a special IPv6 '${ip}'`, function () {
                expect(isValidIP(ip)).to.be.true;
                expect(isGoodIP(ip)).to.be.false;
            });
        });

        // eslint-disable-next-line mocha/no-setup-in-describe
        teredoBogons.forEach((ip) => {
            it(`should return false for a Teredo bogon IPv6 '${ip}'`, function () {
                expect(isValidIP(ip)).to.be.true;
                expect(isGoodIP(ip)).to.be.false;
            });
        });

        // eslint-disable-next-line mocha/no-setup-in-describe
        sixToFourBogons.forEach((ip) => {
            it(`should return false for a 6to4 bogon IPv6 '${ip}'`, function () {
                expect(isValidIP(ip)).to.be.true;
                expect(isGoodIP(ip)).to.be.false;
            });
        });

        // eslint-disable-next-line mocha/no-setup-in-describe
        (
            [
                '::',
                '::1',
                '64:ff9b:1::',
                '64:ff9b:1:ffff:ffff:ffff:ffff:ffff',
                '100::',
                '100:0000:0000:0000:ffff:ffff:ffff:ffff',
                '2001:db8::',
                '2001:db8:ffff:ffff:ffff:ffff:ffff:ffff',
                'fc00::',
                'fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
                'fe80::',
                'febf:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
                'ff00::',
                'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
            ] as const
        ).forEach((ip) => {
            it(`should return false for a bogon IPv6 '${ip}'`, function () {
                expect(isValidIP(ip)).to.be.true;
                expect(isGoodIP(ip)).to.be.false;
            });
        });

        it('should return true for good IPv4', function () {
            expect(isGoodIP('8.8.8.8')).to.be.true;
        });

        it('should return true for good IPv6', function () {
            expect(isGoodIP('2001:4860:4860::8888')).to.be.true;
        });
    });
});
