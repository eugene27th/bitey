const config = require(`${process.cwd()}/config.json`);


if (!config.database?.mysql) {
    return module.exports = null;
};


const connection = require(`mysql2/promise`).createPool(config.database.mysql);


const exe = async function(query, values, params) {
    let [result] = await connection.execute(query, values || []);

    if (result.length < 1) {
        return params?.array ? [] : null;
    };

    if (result.length === 1 && !params?.array) {
        return result[0];
    };

    return result;
};

const get = async function(table, conditions, params) {
    let query = `SELECT * FROM ${table} WHERE `;
    let values = [];

    for (const [column, value] of Object.entries(conditions)) {
        query += `\`${column}\` = ? AND `;
        values.push(value);
    };

    return await exe(query.slice(0, -5), values, params);
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