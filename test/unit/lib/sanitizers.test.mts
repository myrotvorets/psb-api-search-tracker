import { expect } from 'chai';
import {
    sanitizeAddress,
    sanitizeCountry,
    sanitizeDOB,
    sanitizeName,
    sanitizePhone,
} from '../../../src/lib/sanitizers.mjs';

describe('Sanitizers', function () {
    describe('sanitizeName', function () {
        // eslint-disable-next-line mocha/no-setup-in-describe
        (
            [
                ['', ''],
                [' test ', 'test'],
                ['путин-хуйло', ''],
                ['путин -  хуйло', ''],
                ['путин хуйло', ''],
                ['путин-Хуйло', ''],
                ['`путин - хуйлоʼ', ''],
                ['«путин - хуйло»', ''],
                ['„путин - хуйло〞', ''],
                ['《путин - хуйло》', ''],
                ['test !@#', 'test'],
                ["абвгґдєёжзіїйклмнопрст-уфхцчшщ'ʼъиыиеэюя", "абвгґдєёжзіїйклмнопрст-уфхцчшщ'ʼъиыиеэюя"],
                ['one    space', 'one space'],
            ] as const
        ).forEach(([pattern, expected]) => {
            it(`should convert "${pattern}" to "${expected}"`, function () {
                const actual = sanitizeName(pattern);
                expect(actual).to.equal(expected);
            });
        });
    });

    describe('sanitizeDOB', function () {
        // eslint-disable-next-line mocha/no-setup-in-describe
        (
            [
                ['', ''],
                ['24.08.1991', '1991-08-24'],
                ['0000-00-00', '0000-00-00'],
                ['0000-00-000', ''],
                ['12/12/2012', ''],
            ] as const
        ).forEach(([pattern, expected]) => {
            it(`should convert "${pattern}" to "${expected}"`, function () {
                const actual = sanitizeDOB(pattern);
                expect(actual).to.equal(expected);
            });
        });
    });

    describe('sanitizeCountry', function () {
        // eslint-disable-next-line mocha/no-setup-in-describe
        (
            [
                ['', ''],
                ['Украина', 'Украина'],
                ['Гвинея-Бисау', 'Гвинея-Бисау'],
                [' Аландские  острова ', 'Аландские острова'],
                ['44', ''],
                ['Ро$с$сия', 'Россия'],
                ['Россия; Беларусь', 'Россия Беларусь'],
            ] as const
        ).forEach(([pattern, expected]) => {
            it(`should convert "${pattern}" to "${expected}"`, function () {
                const actual = sanitizeCountry(pattern);
                expect(actual).to.equal(expected);
            });
        });
    });

    describe('sanitizeAddress', function () {
        // eslint-disable-next-line mocha/no-setup-in-describe
        (
            [
                ['', ''],
                [' Луганск ', 'Луганск'],
                [
                    'Луганская обл., Славяносербский р-н, пгт Лозовский, ул. Космонавтов 8, кв. 64',
                    'Луганская обл., Славяносербский р-н, пгт Лозовский, ул. Космонавтов 8, кв. 64',
                ],
                ['âęñæåôøúöä', 'âęñæåôøúöä'],
            ] as const
        ).forEach(([pattern, expected]) => {
            it(`should convert "${pattern}" to "${expected}"`, function () {
                const actual = sanitizeAddress(pattern);
                expect(actual).to.equal(expected);
            });
        });
    });

    describe('sanitizePhone', function () {
        // eslint-disable-next-line mocha/no-setup-in-describe
        (
            [
                ['', ''],
                ['+380665436865', '+380665436865'],
                [' +380(66)543-68-65 ', '+380665436865'],
                ['+380 66 543 68 65', '+380665436865'],
                [
                    ' +380 66 543 68 65; +380661234567,+380671234567,   +380971234567 ',
                    '+380665436865 +380661234567 +380671234567 +380971234567',
                ],
            ] as const
        ).forEach(([pattern, expected]) => {
            it(`should convert "${pattern}" to "${expected}"`, function () {
                const actual = sanitizePhone(pattern);
                expect(actual).to.equal(expected);
            });
        });
    });
});
