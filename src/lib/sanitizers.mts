export function sanitizeName(s: string): string {
    if (/^[\p{Ps}\p{Pi}`'"]?\s*путин\s*-?\s*хуйло\s*[\p{Pe}\p{Pf}ʼ'"]?$/iu.test(s)) {
        return '';
    }

    return s
        .replace(/[^\p{L}\p{N}'-]/gu, ' ')
        .replace(/\s+/gu, ' ')
        .trim();
}

export function sanitizeDOB(s: string): string {
    if (s && !/^((\d{4}-\d{2}-\d{2})|(\d{2}\.\d{2}\.\d{4}))$/u.test(s)) {
        return '';
    }

    if (s[2] === '.') {
        s = s.split('.').reverse().join('-');
    }

    return s;
}

export function sanitizeCountry(s: string): string {
    return s
        .replace(/[^\p{L}' -]/gu, '')
        .replace(/\s+/gu, ' ')
        .trim();
}

export function sanitizeAddress(s: string): string {
    return s
        .replace(/[^\p{L}\p{N}\p{P} ]/gu, ' ')
        .replace(/\s+/gu, ' ')
        .trim();
}

export function sanitizePhone(s: string): string {
    return s
        .replace(/[^0-9+;,]/gu, '')
        .replace(/[;,]/gu, ' ')
        .replace(/\s+/u, ' ')
        .trim();
}
