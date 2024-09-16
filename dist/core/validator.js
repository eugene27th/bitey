let error = null;

let types = {
    boolean: {
        typeof: `boolean`
    },
    number: {
        typeof: `number`
    },
    integer: {
        typeof: `number`,
        integer: true
    },
    float: {
        typeof: `number`,
        float: true
    },
    string: {
        typeof: `string`
    },

    id: {
        typeof: `number`,
        integer: true,
        min: 1,
        max: 1e18
    },
    
    str_boolean: {
        typeof: `string`,
        enums: [`true`, `false`]
    },
    str_number: {
        typeof: `string`,
        number: true
    },
    str_integer: {
        typeof: `string`,
        number: true,
        integer: true
    },
    str_float: {
        typeof: `string`,
        number: true,
        float: true
    },

    str_id: {
        typeof: `string`,
        number: true,
        integer: true,
        min: 1,
        max: 1e18
    },

    pat_string_default: {
        typeof: `string`,
        pattern: `^[a-zA-Zа-яА-ЯёЁ0-9.,=~"/%#:;!?@$()_+-][a-zA-Zа-яА-ЯёЁ0-9.,=~"/%#:;!?@$()_+ -]*[a-zA-Zа-яА-ЯёЁ0-9.,=~"/%#:;!?@$()_+-]$`
    },
    pat_string_safe: {
        typeof: `string`,
        pattern: `^[a-zA-Z0-9._-]+$`
    },
    pat_password: {
        typeof: `string`,
        pattern: `^[a-zA-Zа-яА-ЯёЁ0-9.,=~"'*/%#<>^&|:;!?@$()_+-]+$`
    },
    pat_date: {
        typeof: `string`,
        pattern: `[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])`
    },
    pat_datetime: {
        typeof: `string`,
        pattern: `[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1]) (2[0-3]|[01][0-9]):[0-5][0-9]`
    },
    pat_timestamp: {
        typeof: `string`,
        pattern: `^[0-9]{10}$`
    },
    pat_url: {
        typeof: `string`,
        pattern: `^((ftp|http|https):\/\/)?(www\.)?([A-Za-zА-Яа-я0-9]{1}[A-Za-zА-Яа-я0-9\-]*\.?)*\.{1}[A-Za-zА-Яа-я0-9-]{2,8}(\/([\w#!:.?+=&%@!\-\/])*)?`
    },
    pat_domain: {
        typeof: `string`,
        pattern: `(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]`
    },
    pat_uuid: {
        typeof: `string`,
        pattern: `^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$`
    },
    pat_uuidts: {
        typeof: `string`,
        pattern: `^[0-9a-f]{13}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{17}$`
    },
    pat_filename: {
        typeof: `string`,
        pattern: `^[0-9a-f]{13}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{17}.(png|jpeg|jpg|webp|gif)$`
    },
    pat_email: {
        typeof: `string`,
        pattern: `^[a-zA-Z0-9_'+*/^&=?~{}\-](\.?[a-zA-Z0-9_'+*/^&=?~{}\-])*\@((\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(\:\d{1,3})?)|(((([a-zA-Z0-9][a-zA-Z0-9\-]+[a-zA-Z0-9])|([a-zA-Z0-9]{1,2}))[\.]{1})+([a-zA-Z]{2,6})))$`
    },
    pat_phone: {
        typeof: `string`,
        pattern: `^[0-9]{6,12}$`
    },
    pat_ipv4: {
        typeof: `string`,
        pattern: `^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$`
    },

    val_mimetype: {
        typeof: `string`,
        enums: [
            `image/png`, `image/jpeg`, `image/webp`, `image/gif`, `image/svg+xml`, `application/zip`, `application/zip-compressed`, `application/x-zip-compressed`, `video/mp4`
        ]
    },
    val_country: {
        typeof: `string`,
        enums: [
            `AA`
        ]
    },
    val_language: {
        typeof: `string`,
        enums: [
            `ab`, `aa`, `af`, `ak`, `sq`, `am`, `ar`, `an`, `hy`, `as`, `av`, `ae`, `ay`, `az`, `bm`, `ba`, `eu`, `be`, `bn`, `bi`, `bs`, `br`, `bg`, `my`, `ca`, `ch`, `ce`, `ny`, `zh`, `cu`, `cv`, `kw`, `co`, `cr`, `hr`, `cs`, `da`, `dv`, `nl`, `dz`, `en`, `eo`, `et`, `ee`, `fo`, `fj`, `fi`, `fr`, `fy`, `ff`, `gd`, `gl`, `lg`, `ka`, `de`, `el`, `kl`, `gn`, `gu`, `ht`, `ha`, `he`, `hz`, `hi`, `ho`, `hu`, `is`, `io`, `ig`, `id`, `ia`, `ie`, `iu`, `ik`, `ga`, `it`, `ja`, `jv`, `kn`, `kr`, `ks`, `kk`, `km`, `ki`, `rw`, `ky`, `kv`, `kg`, `ko`, `kj`, `ku`, `lo`, `la`, `lv`, `li`, `ln`, `lt`, `lu`, `lb`, `mk`, `mg`, `ms`, `ml`, `mt`, `gv`, `mi`, `mr`, `mh`, `mn`, `na`, `nv`, `nd`, `nr`, `ng`, `ne`, `no`, `nb`, `nn`, `ii`, `oc`, `oj`, `or`, `om`, `os`, `pi`, `ps`, `fa`, `pl`, `pt`, `pa`, `qu`, `ro`, `rm`, `rn`, `ru`, `se`, `sm`, `sg`, `sa`, `sc`, `sr`, `sn`, `sd`, `si`, `sk`, `sl`, `so`, `st`, `es`, `su`, `sw`, `ss`, `sv`, `tl`, `ty`, `tg`, `ta`, `tt`, `te`, `th`, `bo`, `ti`, `to`, `ts`, `tn`, `tr`, `tk`, `tw`, `ug`, `uk`, `ur`, `uz`, `ve`, `vi`, `vo`, `wa`, `cy`, `wo`, `xh`, `yi`, `yo`, `za`, `zu`
        ]
    }
};


const f_error = function() {
    return error;  
};

const f_value = function(value, schema) {
	if (typeof value === `undefined`) {
		error = `missing`;
		return false;
	};

	let required = types[schema.type];

	if (!required) {
		error = `unknown type`;
		return false;
	};

	// value typeof
	if (typeof value !== required.typeof) {
		error = `'${required.typeof}' required, got: '${typeof value}'`;
		return false;
	};

	// required enums
	if (required.enums && !required.enums.includes(value)) {
		error = `'${required.enums.join(` / `)}' required`;
		return false;
	};

	if (schema.enums && !schema.enums.includes(value)) {
		error = `'${schema.enums.join(` / `)}' required`;
		return false;
	};

	// if number
	if ((required.typeof === `number` || required.number) && isNaN(value)) {
		error = `'number' required`;
		return false;
	};

	// if integer
	if (required.integer && value % 1 !== 0) {
		error = `'integer number' required`;
		return false;
	};

	// if float
	if (required.float && value % 1 === 0) {
		error = `'float number' required`;
		return false;
	};

	// length/size
	let min = typeof schema.min !== `undefined` ? schema.min : required.min;
	let max = typeof schema.max !== `undefined` ? schema.max : required.max;
	let length = (required.typeof === `string` && !required.number) ? value.length : value;

	if ((min || min === 0) && length < min) {
		error = `'${min} < value (length)' required`;
		return false;
	};
	
	if ((max || max === 0) && length > max) {
		error = `'value (length) < ${max}' required`;
		return false;
	};
	
	// pattern
	if (required.pattern && !(new RegExp(required.pattern)).test(value)) {
		error = `string in pattern '${schema.type}' required`;
		return false;
	};

	return true;
};

const f_array = function(array, schema) {
    if (typeof array !== `object` && !Array.isArray(array)) {
        error = `array is invalid`;
        return false;
    };

    let length = array.length;

    if (schema.min && length < schema.min) {
        error = `'${schema.min} < length' required`;
        return false;
    };

    if (schema.max && length > schema.max) {
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
                if (!f_array(item, schema.items)) {
                    error = `array invalid in [${i}] > ${error}`;
                    return false;
                };
                
                continue;
            };
    
            if (schema.items.type === `object`) {
                if (!f_json(item, schema.items)) {
                    error = `array invalid in [${i}] > ${error}`;
                    return false;
                };
    
                continue;
            };
    
            if (!f_value(item, schema.items)) {
                error = `array invalid in [${i}] > ${error}`;
                return false;
            };
        };

        approved.add(item);
    };

    return true;
};

const f_json = function(json, schema) {
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

	if (schema.min && json_length < schema.min) {
		error = `'${schema.min} < length' required`;
		return false;
	};

	if (schema.max && json_length > schema.max) {
		error = `'length < ${schema.max}' required`;
		return false;
	};

	for (let [key, properties] of Object.entries(schema.properties)) {
		if (properties.required && json[key] !== 0 && !json[key]) {
			error = `'${key}' is missing`;
			return false;
		};
	};

	for (let [key, value] of Object.entries(json)) {
		if (!schema.properties[key]) {
			error = `'${key}' is not required`;
			return false;
		};

		if (schema.properties[key].null && value === null) {
			continue;
		};

        if (schema.properties[key].type === `array`) {
            if (!f_array(value, schema.properties[key])) {
                error = `'${key}' is invalid > ${error}`;
				return false;
			};
            
            continue;
        };

		if (schema.properties[key].type === `object`) {
			if (!f_json(value, schema.properties[key])) {
                error = `'${key}' is invalid > ${error}`;
				return false;
			};

			continue;
		};

		if (!f_value(value, schema.properties[key])) {
			error = `'${key}' is invalid > ${error}`;
			return false;
		};
	};

	return true;
};


module.exports = {
    error: f_error,
    value: f_value,
    array: f_array,
    json: f_json
};