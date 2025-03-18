/*
    (sql query, values, options)

    options:
        - array: false // default: false | always return result in array, even if there is no value or its length is 1
        - nesting: true // default: true | nesting keys from { "one.two.three": "value" } to { "one": { "two": { "three": "value" } } }
        - boolean: true // default: true | transform "true" and "false" enums to boolean

    example:
        SELECT * FROM accounts WHERE `username` = 'salwador'
*/

const exe = await bitey.mysql.exe(`SELECT * FROM accounts WHERE username = ?`, [`salwador`], { array: true });


/*
    (table name, conditions, options)

    conditions:
        { key: `value` } // where key = value

    options:
        - array: false // default: false | always return result in array, even if there is no value or its length is 1
        - nesting: true // default: true | nesting keys from { "one.two.three": "value" } to { "one": { "two": { "three": "value" } } }
        - boolean: true // default: true | transform "true" and "false" enums to boolean

    example:
        SELECT * FROM accounts WHERE `username` = 'salwador'
*/

const get = await bitey.mysql.get(`accounts`, {
    username: `salwador`
}, {
    array: true
});


/*
    (table name, values, options)

    values:
        { key: `value` } // set key = value

    options:
        - on_duplicate: [`column`] // update columns if row already exists (adds ON DUPLICATE KEY UPDATE)

    example:
        INSERT INTO accounts SET `username` = 'salwador', `edited` = '1234567890' ON DUPLICATE KEY UPDATE `edited` = '1234567890'
*/

const ins = await bitey.mysql.ins(`accounts`, {
    username: `salwador`,
    edited: `1234567890`
}, {
    on_duplicate: [`edited`]
});


/*
    (table name, conditions, values)

    conditions:
        { key: `value` } // where key = value

    values:
        { key: `value` } // set key = value

    example:
        UPDATE accounts SET `username` = 'salwador' WHERE `id` = '1'
*/

const upd = await bitey.mysql.upd(`accounts`, { id: 1 }, {
    username: `salwador`
});


/*
    (table name, conditions)

    conditions:
        { key: `value` } // where key = value

    example:
        DELETE FROM accounts WHERE `id` = '1'
*/

const del = await bitey.mysql.del(`accounts`, { id: 1 });