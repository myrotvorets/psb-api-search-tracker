/// <reference path="../../tap.d.ts"/>
import tap from 'tap';
import { sanitizeName, sanitizeDOB, sanitizeCountry, sanitizeAddress, sanitizePhone } from '../src/utils/sanitizers';

tap.test('sanitizeName', (t: any): void => {
    const patterns: Record<string, string> = {
        '': '',
        ' test ': 'test',
        'путин-хуйло': '',
        'путин -  хуйло': '',
        'путин хуйло': '',
        'путин-Хуйло': '',
        '`путин - хуйлоʼ': '',
        '«путин - хуйло»': '',
        '„путин - хуйло〞': '',
        '《путин - хуйло》': '',
        'test !@#': 'test',
        "абвгґдєёжзіїйклмнопрст-уфхцчшщ'ʼъиыиеэюя": "абвгґдєёжзіїйклмнопрст-уфхцчшщ'ʼъиыиеэюя",
        'one    space': 'one space',
    };

    for (const pattern in patterns) {
        const actual = sanitizeName(pattern);
        const expected = patterns[pattern];
        t.strictEqual(actual, expected);
    }

    t.end();
});

tap.test('sanitizeDOB', (t: any): void => {
    const patterns: Record<string, string> = {
        '': '',
        '24.08.1991': '24.08.1991',
        '0000-00-00': '0000-00-00',
        '0000-00-000': '',
        '12/12/2012': '',
    };

    for (const pattern in patterns) {
        const actual = sanitizeDOB(pattern);
        const expected = patterns[pattern];
        t.strictEqual(actual, expected);
    }

    t.end();
});

tap.test('sanitizeCountry', (t: any): void => {
    const patterns: Record<string, string> = {
        '': '',
        ['Украина']: 'Украина',
        'Гвинея-Бисау': 'Гвинея-Бисау',
        ' Аландские  острова ': 'Аландские острова',
        '44': '',
        ['Ро$с$сия']: 'Россия',
    };

    for (const pattern in patterns) {
        const actual = sanitizeCountry(pattern);
        const expected = patterns[pattern];
        t.strictEqual(actual, expected);
    }

    t.end();
});

tap.test('sanitizeAddress', (t: any): void => {
    const patterns: Record<string, string> = {
        '': '',
        ' Луганск ': 'Луганск',
        'Луганская обл., Славяносербский р-н, пгт Лозовский, ул. Космонавтов 8, кв. 64':
            'Луганская обл., Славяносербский р-н, пгт Лозовский, ул. Космонавтов 8, кв. 64',
        ['âęñæåôøúöä']: 'âęñæåôøúöä',
    };

    for (const pattern in patterns) {
        const actual = sanitizeAddress(pattern);
        const expected = patterns[pattern];
        t.strictEqual(actual, expected);
    }

    t.end();
});

tap.test('sanitizePhone', (t: any): void => {
    const patterns: Record<string, string> = {
        '': '',
        '+380665436865': '+380665436865',
        ' +380(66)543-68-65 ': '+380665436865',
        '+380 66 543 68 65': '+380665436865',
    };

    for (const pattern in patterns) {
        const actual = sanitizePhone(pattern);
        const expected = patterns[pattern];
        t.strictEqual(actual, expected);
    }

    t.end();
});
