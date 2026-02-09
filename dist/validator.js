let error = null;

const enums = {
    country: [
        `AD`, `AE`, `AF`, `AG`, `AI`, `AL`, `AM`, `AO`, `AQ`, `AR`, `AS`, `AT`, `AU`, `AW`, `AX`, `AZ`, `BA`, `BB`, `BD`, `BE`, `BF`, `BG`, `BH`, `BI`, `BJ`, `BL`, `BM`, `BN`, `BO`, `BQ`, `BR`, `BS`, `BT`, `BV`, `BW`, `BY`, `BZ`, `CA`, `CC`, `CD`, `CF`, `CG`, `CH`, `CI`, `CK`, `CL`, `CM`, `CN`, `CO`, `CR`, `CU`, `CV`, `CW`, `CX`, `CY`, `CZ`, `DE`, `DJ`, `DK`, `DM`, `DO`, `DZ`, `EC`, `EE`, `EG`, `EH`, `ER`, `ES`, `ET`, `FI`, `FJ`, `FK`, `FM`, `FO`, `FR`, `GA`, `GB`, `GD`, `GE`, `GF`, `GG`, `GH`, `GI`, `GL`, `GM`, `GN`, `GP`, `GQ`, `GR`, `GS`, `GT`, `GU`, `GW`, `GY`, `HK`, `HM`, `HN`, `HR`, `HT`, `HU`, `ID`, `IE`, `IL`, `IM`, `IN`, `IO`, `IQ`, `IR`, `IS`, `IT`, `JE`, `JM`, `JO`, `JP`, `KE`, `KG`, `KH`, `KI`, `KM`, `KN`, `KP`, `KR`, `KW`, `KY`, `KZ`, `LA`, `LB`, `LC`, `LI`, `LK`, `LR`, `LS`, `LT`, `LU`, `LV`, `LY`, `MA`, `MC`, `MD`, `ME`, `MF`, `MG`, `MH`, `MK`, `ML`, `MM`, `MN`, `MO`, `MP`, `MQ`, `MR`, `MS`, `MT`, `MU`, `MV`, `MW`, `MX`, `MY`, `MZ`, `NA`, `NC`, `NE`, `NF`, `NG`, `NI`, `NL`, `NO`, `NP`, `NR`, `NU`, `NZ`, `OM`, `PA`, `PE`, `PF`, `PG`, `PH`, `PK`, `PL`, `PM`, `PN`, `PR`, `PS`, `PT`, `PW`, `PY`, `QA`, `RE`, `RO`, `RS`, `RU`, `RW`, `SA`, `SB`, `SC`, `SD`, `SE`, `SG`, `SH`, `SI`, `SJ`, `SK`, `SL`, `SM`, `SN`, `SO`, `SR`, `SS`, `ST`, `SV`, `SX`, `SY`, `SZ`, `TC`, `TD`, `TF`, `TG`, `TH`, `TJ`, `TK`, `TL`, `TM`, `TN`, `TO`, `TR`, `TT`, `TV`, `TW`, `TZ`, `UA`, `UG`, `UM`, `US`, `UY`, `UZ`, `VA`, `VC`, `VE`, `VG`, `VI`, `VN`, `VU`, `WF`, `WS`, `YE`, `YT`, `ZA`, `ZM`, `ZW`
    ],
    language: [
        `ab`, `aa`, `af`, `ak`, `sq`, `am`, `ar`, `an`, `hy`, `as`, `av`, `ae`, `ay`, `az`, `bm`, `ba`, `eu`, `be`, `bn`, `bi`, `bs`, `br`, `bg`, `my`, `ca`, `ch`, `ce`, `ny`, `zh`, `cu`, `cv`, `kw`, `co`, `cr`, `hr`, `cs`, `da`, `dv`, `nl`, `dz`, `en`, `eo`, `et`, `ee`, `fo`, `fj`, `fi`, `fr`, `fy`, `ff`, `gd`, `gl`, `lg`, `ka`, `de`, `el`, `kl`, `gn`, `gu`, `ht`, `ha`, `he`, `hz`, `hi`, `ho`, `hu`, `is`, `io`, `ig`, `id`, `ia`, `ie`, `iu`, `ik`, `ga`, `it`, `ja`, `jv`, `kn`, `kr`, `ks`, `kk`, `km`, `ki`, `rw`, `ky`, `kv`, `kg`, `ko`, `kj`, `ku`, `lo`, `la`, `lv`, `li`, `ln`, `lt`, `lu`, `lb`, `mk`, `mg`, `ms`, `ml`, `mt`, `gv`, `mi`, `mr`, `mh`, `mn`, `na`, `nv`, `nd`, `nr`, `ng`, `ne`, `no`, `nb`, `nn`, `ii`, `oc`, `oj`, `or`, `om`, `os`, `pi`, `ps`, `fa`, `pl`, `pt`, `pa`, `qu`, `ro`, `rm`, `rn`, `ru`, `se`, `sm`, `sg`, `sa`, `sc`, `sr`, `sn`, `sd`, `si`, `sk`, `sl`, `so`, `st`, `es`, `su`, `sw`, `ss`, `sv`, `tl`, `ty`, `tg`, `ta`, `tt`, `te`, `th`, `bo`, `ti`, `to`, `ts`, `tn`, `tr`, `tk`, `tw`, `ug`, `uk`, `ur`, `uz`, `ve`, `vi`, `vo`, `wa`, `cy`, `wo`, `xh`, `yi`, `yo`, `za`, `zu`
    ]
};

const patterns = {
    uuid: `^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$`,
    uuidts: `^[0-9a-f]{13}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{17}$`,
};


export const getValidationError = function() {
    return error;
};

export const isValidValue = function(value, schema) {
    if (typeof value === `undefined`) {
        error = `missing`;
        return false;
    };

    switch (schema.type) {
        case `boolean`: {
            if (!schema.string) {
                if (typeof value !== `boolean`) {
                    error = `'boolean' required`;
                    return false;
                };
            } else {
                if (value !== `true` && value !== `false`) {
                    error = `'boolean in string' required`;
                    return false;
                };
            };

            break;
        };

        case `string`: {
            if (typeof value !== `string`) {
                error = `'string' required`;
                return false;
            };

            value = value.trim();

            if (schema.min !== undefined && value.length < schema.min) {
                error = `'${schema.min} < length' required`;
                return false;
            };

            if (schema.max !== undefined && value.length > schema.max) {
                error = `'length < ${schema.max}' required`;
                return false;
            };

            break;
        };

        case `number`: {
            if (!schema.string) {
                if (typeof value !== `number`) {
                    error = `'number' required`;
                    return false;
                };
            } else {
                if (typeof value !== `string`) {
                    error = `'number in string' required`;
                    return false;
                };

                value = parseInt(value);
            };

            if (isNaN(value)) {
                error = `'number' required`;
                return false;
            };

            if (schema.min !== undefined && value < schema.min) {
                error = `'${schema.min} < value' required`;
                return false;
            };

            if (schema.max !== undefined && value > schema.max) {
                error = `'value < ${schema.max}' required`;
                return false;
            };

            break;
        };

        case `int`: {
            if (!schema.string) {
                if (typeof value !== `number`) {
                    error = `'number' required`;
                    return false;
                };
            } else {
                if (typeof value !== `string`) {
                    error = `'number in string' required`;
                    return false;
                };

                value = parseInt(value);
            };

            if (isNaN(value) || value % 1 !== 0) {
                error = `'int' required`;
                return false;
            };

            if (schema.min !== undefined && value < schema.min) {
                error = `'${schema.min} < value' required`;
                return false;
            };

            if (schema.max !== undefined && value > schema.max) {
                error = `'value < ${schema.max}' required`;
                return false;
            };

            break;
        };

        case `uint`: {
            if (!schema.string) {
                if (typeof value !== `number`) {
                    error = `'number' required`;
                    return false;
                };
            } else {
                if (typeof value !== `string`) {
                    error = `'number in string' required`;
                    return false;
                };

                value = parseInt(value);
            };

            if (isNaN(value) || value % 1 !== 0 || value < 0) {
                error = `'uint' required`;
                return false;
            };

            if (schema.max !== undefined && value > schema.max) {
                error = `'value < ${schema.max}' required`;
                return false;
            };

            break;
        };

        case `int8`: {
            if (!schema.string) {
                if (typeof value !== `number`) {
                    error = `'number' required`;
                    return false;
                };
            } else {
                if (typeof value !== `string`) {
                    error = `'number in string' required`;
                    return false;
                };

                value = parseInt(value);
            };

            if (isNaN(value) || value % 1 !== 0 || value < -128 || value > 128) {
                error = `'int8' required`;
                return false;
            };

            break;
        };

        case `uint8`: {
            if (!schema.string) {
                if (typeof value !== `number`) {
                    error = `'number' required`;
                    return false;
                };
            } else {
                if (typeof value !== `string`) {
                    error = `'number in string' required`;
                    return false;
                };

                value = parseInt(value);
            };

            if (isNaN(value) || value % 1 !== 0 || value < 0 || value > 256) {
                error = `'uint8' required`;
                return false;
            };

            break;
        };

        case `int16`: {
            if (!schema.string) {
                if (typeof value !== `number`) {
                    error = `'number' required`;
                    return false;
                };
            } else {
                if (typeof value !== `string`) {
                    error = `'number in string' required`;
                    return false;
                };

                value = parseInt(value);
            };

            if (isNaN(value) || value % 1 !== 0 || value < -32768 || value > 32768) {
                error = `'int16' required`;
                return false;
            };

            break;
        };

        case `uint16`: {
            if (!schema.string) {
                if (typeof value !== `number`) {
                    error = `'number' required`;
                    return false;
                };
            } else {
                if (typeof value !== `string`) {
                    error = `'number in string' required`;
                    return false;
                };

                value = parseInt(value);
            };

            if (isNaN(value) || value % 1 !== 0 || value < 0 || value > 65536) {
                error = `'uint16' required`;
                return false;
            };

            break;
        };

        case `int32`: {
            if (!schema.string) {
                if (typeof value !== `number`) {
                    error = `'number' required`;
                    return false;
                };
            } else {
                if (typeof value !== `string`) {
                    error = `'number in string' required`;
                    return false;
                };

                value = parseInt(value);
            };

            if (isNaN(value) || value % 1 !== 0 || value < -2147483648 || value > 2147483648) {
                error = `'int32' required`;
                return false;
            };

            break;
        };

        case `uint32`: {
            if (!schema.string) {
                if (typeof value !== `number`) {
                    error = `'number' required`;
                    return false;
                };
            } else {
                if (typeof value !== `string`) {
                    error = `'number in string' required`;
                    return false;
                };

                value = parseInt(value);
            };

            if (isNaN(value) || value % 1 !== 0 || value < 0 || value > 4294967295) {
                error = `'uint32' required`;
                return false;
            };

            break;
        };

        case `float`: {
            if (!schema.string) {
                if (typeof value !== `number`) {
                    error = `'number' required`;
                    return false;
                };
            } else {
                if (typeof value !== `string`) {
                    error = `'number in string' required`;
                    return false;
                };

                value = parseFloat(value);
            };

            if (isNaN(value)) {
                error = `'float' required`;
                return false;
            };

            if (schema.min !== undefined && value < schema.min) {
                error = `'${schema.min} < value' required`;
                return false;
            };

            if (schema.max !== undefined && value > schema.max) {
                error = `'value < ${schema.max}' required`;
                return false;
            };

            break;
        };

        case `enum`: {
            let array = schema.enum;

            if (typeof schema.enum === `string`) {
                array = enums[schema.enum];

                if (!array) {
                    error = `enum not found`;
                    return false;
                };
            };

            if (!array.includes(value)) {
                error = `'${array.join(` / `)}' required`;
                return false;
            };

            break;
        };

        case `pattern`: {
            if (typeof value !== `string`) {
                error = `string with pattern '${schema.pattern}' required`;
                return false;
            };

            let pattern = schema.pattern;

            if (typeof schema.pattern === `string`) {
                pattern = patterns[schema.pattern];

                if (!pattern) {
                    error = `pattern not found`;
                    return false;
                };
            };

            value = value.trim();

            if (!(new RegExp(pattern)).test(value)) {
                error = `pattern '${schema.pattern}' required`;
                return false;
            };

            if (schema.min !== undefined && value.length < schema.min) {
                error = `'${schema.min} < length' required`;
                return false;
            };

            if (schema.max !== undefined && value.length > schema.max) {
                error = `'length < ${schema.max}' required`;
                return false;
            };

            break;
        };

        default: {
            error = `invalid type`;
            return false;
        };
    };

    return true;
};

export const isValidArray = function(array, schema) {
    if (typeof array !== `object` || !Array.isArray(array)) {
        error = `array is invalid`;
        return false;
    };

    const length = array.length;

    if (schema.min !== undefined && length < schema.min) {
        error = `'${schema.min} < length' required`;
        return false;
    };

    if (schema.max !== undefined && length > schema.max) {
        error = `'length < ${schema.max}' required`;
        return false;
    };

    let approved = new Set();

    for (let i = 0; i < length; i++) {
        const item = array[i];

        if (!schema.duplicates && approved.has(item)) {
            error = `array invalid in [${i}] > array without duplicates required`;
            return false;
        };

        if (schema.items) {
            if (schema.items.type === `array`) {
                if (!isValidArray(item, schema.items)) {
                    error = `array invalid in [${i}] > ${error}`;
                    return false;
                };

                continue;
            };

            if (schema.items.type === `object`) {
                if (!isValidObject(item, schema.items)) {
                    error = `array invalid in [${i}] > ${error}`;
                    return false;
                };

                continue;
            };

            if (!isValidValue(item, schema.items)) {
                error = `array invalid in [${i}] > ${error}`;
                return false;
            };
        };

        approved.add(item);
    };

    return true;
};

export const isValidObject = function(json, schema) {
    if (typeof json !== `object`) {
        error = `JSON is invalid`;
        return false;
    };

    if (!schema) {
        return true;
    };

    if (Array.isArray(json)) {
        error = `JSON is invalid`;
        return false;
    };

    const json_length = Object.keys(json).length;

    if (schema.min !== undefined && json_length < schema.min) {
        error = `'${schema.min} < length' required`;
        return false;
    };

    if (schema.max !== undefined && json_length > schema.max) {
        error = `'length < ${schema.max}' required`;
        return false;
    };

    if (schema.entries) {
        for (const [key, entries] of Object.entries(schema.entries)) {
            if (entries.required && json[key] !== 0 && !json[key]) {
                error = `'${key}' is missing`;
                return false;
            };
        };

        for (const [key, value] of Object.entries(json)) {
            if (!schema.entries[key]) {
                error = `'${key}' is not required`;
                return false;
            };

            if (schema.entries[key].null && value === null) {
                continue;
            };

            if (schema.entries[key].type === `array`) {
                if (!isValidArray(value, schema.entries[key])) {
                    error = `'${key}' is invalid > ${error}`;
                    return false;
                };

                continue;
            };

            if (schema.entries[key].type === `object`) {
                if (!isValidObject(value, schema.entries[key])) {
                    error = `'${key}' is invalid > ${error}`;
                    return false;
                };

                continue;
            };

            if (!isValidValue(value, schema.entries[key])) {
                error = `'${key}' is invalid > ${error}`;
                return false;
            };
        };
    };

    return true;
};