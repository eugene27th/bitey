import { randomUUID } from "crypto";
import { join as joinPath } from "path";
import { readFileSync as fsReadFile } from "fs";


export const getConfig = function() {
    try {
        return JSON.parse(fsReadFile(joinPath(process.cwd(), `config.json`)));
    } catch (error) {
        console.error(`config file error`);
        return {};
    };
};


export const tryFetch = async function(url, options) {
    for (let a = 1; a <= 5; a++) {
        try {
            return await fetch(url, options);
        } catch (error) {
            if (a >= 5) {
                return {
                    ok: false,
                    error: error
                };
            };
        };
    };
};


export const getDate = function(mode = `d.m.y`) {
    const date = new Date();

    if (mode === `ymd`) {
        return date.toISOString().slice(0, 10);
    };

    if (mode === `m.y`) {
        return `${`${date.getUTCMonth() + 1}`.padStart(2, `0`)}.${date.getUTCFullYear()}`;
    };

    return `${`${date.getUTCDate()}`.padStart(2, `0`)}.${`${date.getUTCMonth() + 1}`.padStart(2, `0`)}.${date.getUTCFullYear()}`;
};

export const getTime = function() {
    const date = new Date();
    return `${`${date.getUTCHours()}`.padStart(2, `0`)}:${`${date.getUTCMinutes()}`.padStart(2, `0`)}:${`${date.getUTCSeconds()}`.padStart(2, `0`)}Z`;
};

export const getTimestamp = function(date) {
    if (date) {
        return Math.round((new Date(date).getTime()) / 1000);
    };

    return Math.round((new Date().getTime()) / 1000);
};


export const randomUUIDTS = function() {
    const uuid = randomUUID();
    const ts = `${getTimestamp()}`;

    return `${uuid.slice(0, 4)}${ts.slice(5)}${uuid.slice(4, 30)}${ts.slice(0, 5)}${uuid.slice(-6)}`;
};

export const randomString = function(length, includes = [`default`]) {
    const charset = {
        "default": `QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm0123456789`,
        "letters": `QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm`,
        "letters-l": `qwertyuiopasdfghjklzxcvbnm`,
        "letters-u": `QWERTYUIOPASDFGHJKLZXCVBNM`,
        "numbers": `0123456789`,
        "symbols": `!?@#$%^&*<>-+=`
    };

    let chars = ``;

    for (const type of includes) {
        chars += charset[type];
    };

    let result = ``;

    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    };

    return result;
};


export const parseCookie = function(cookie) {
    if (!cookie || cookie.length < 1) {
        return null;
    };

    const pairs = cookie.replaceAll(` `, ``).split(`;`);

    if (pairs.length < 1) {
        return null;
    };

    let result = {};

    for (const pair of pairs) {
        const [name, value] = pair.split(`=`);
        result[name] = value;
    };

    return result;
};

export const serializeCookie = function(name, value, options = {}) {
    let attributes = [];

    if (options.age) {
        attributes.push(`Max-Age=${options.age}`);
    };

    if (options.path) {
        attributes.push(`Path=${options.path}`);
    };

    if (options.domain) {
        attributes.push(`Domain=${options.domain}`);
    };

    if (options.samesite) {
        attributes.push(`SameSite=${options.samesite}`);
    };

    if (options.secure) {
        attributes.push(`Secure`);
    };

    if (attributes.length < 1) {
        return `${name}=${value};`;
    } else {
        return `${name}=${value}; ${attributes.join(`; `)}`;
    };
};