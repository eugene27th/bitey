const config = require(`${process.cwd()}/config.json`);

if (!config.mysql) {
    return module.exports = null;
};

const connection = require(`mysql2/promise`).createPool(config.mysql);


const exe = async function(query, values, params) {
    const [result, fields] = await connection.execute(query, values || []);

    if (!Array.isArray(result)) {
        return result;
    };

    if (result.length < 1) {
        return params?.array ? [] : null;
    };

    if (fields?.length > 0) {
        if (params?.boolean === undefined || params?.boolean === true) {
            const enums = {};

            for (const field of fields) {
                if (field.type === 254 && (field.flags & 256) === 256) {
                    enums[field.name] = true;
                };
            };

            if (Object.keys(enums).length > 0) {
                for (let i = 0; i < result.length; i++) {
                    for (const field in enums) {
                        const value = result[i][field];

                        if (value === `true`) {
                            result[i][field] = true;
                        } else if (value === `false`) {
                            result[i][field] = false;
                        };
                    };
                };
            };
        };

        if (params?.nesting === undefined || params?.nesting === true) {
            for (let i = 0; i < result.length; i++) {
                const input = result[i];

                const output = {};

                for (const key in input) {
                    const path = key.split(`.`);
                    const value = input[key];

                    let current = output;

                    for (let i = 0; i < path.length - 1; i++) {
                        const segment = path[i];

                        if (!current[segment]) {
                            current[segment] = {};
                        };

                        current = current[segment];
                    };

                    current[path[path.length - 1]] = value;
                };

                result[i] = output;
            };
        };
    };

    if (result.length === 1 && !params?.array) {
        return result[0];
    };

    return result;
};

const get = async function(table, conditions, params) {
    let query = `SELECT * FROM ${table}`;
    let values = [];

    if (conditions) {
        query += ` WHERE `;

        for (const [column, value] of Object.entries(conditions)) {
            query += `\`${column}\` = ? AND `;
            values.push(value);
        };

        query = query.slice(0, -5);
    };

    return await exe(query, values, params);
};

const ins = async function(table, data, params) {
    let query = `INSERT INTO ${table} SET `;
    let values = [];

    for (const [column, value] of Object.entries(data)) {
        query += `\`${column}\` = ?, `;
        values.push(value);
    };

    query = query.slice(0, -2);

    if (params?.on_duplicate) {
        query += ` ON DUPLICATE KEY UPDATE `;

        for (const [column, value] of Object.entries(data)) {
            if (!params.on_duplicate.includes(column)) {
                continue;
            };

            query += `\`${column}\` = ?, `;
            values.push(value);
        };

        query = query.slice(0, -2);
    };

    return await exe(query, values, params);
};

const upd = async function(table, conditions, data) {
    let query = `UPDATE ${table} SET `;
    let values = [];

    for (const [column, value] of Object.entries(data)) {
        query += `\`${column}\` = ?, `;
        values.push(value);
    };

    query = `${query.slice(0, -2)} WHERE `;

    for (const [column, value] of Object.entries(conditions)) {
        query += `\`${column}\` = ? AND `;
        values.push(value);
    };

    return await exe(query.slice(0, -5), values);
};

const del = async function(table, conditions) {
    let query = `DELETE FROM ${table} WHERE `;
    let values = [];

    for (const [column, value] of Object.entries(conditions)) {
        query += `\`${column}\` = ? AND `;
        values.push(value);
    };

    return await exe(query.slice(0, -5), values);
};


module.exports = {
    exe,
    get,
    ins,
    upd,
    del
};