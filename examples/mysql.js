/*
    required `mysql` section in config.json
*/

import { mysqlExe, mysqlGet, mysqlInsert, mysqlUpdate, mysqlDelete } from "bitey/mysql";


/*
    args: (sql query, values, options)

    options:
        - array: false // default: false | always return result in array, even if there is no value or its length is 1
        - nesting: true // default: true | nesting keys from { "one.two.three": "value" } to { "one": { "two": { "three": "value" } } }
        - boolean: true // default: true | transform "true" and "false" enums to boolean

    example:
        SELECT * FROM accounts WHERE `username` = 'salwador'
*/

const exeResult = await mysqlExe(`SELECT * FROM accounts WHERE username = ?`, [`salwador`], { array: true });


/*
    args: (table name, conditions, options)

    conditions:
        { key: `value` } // where key = value

    options:
        - array: false // default: false | always return result in array, even if there is no value or its length is 1
        - nesting: true // default: true | nesting keys from { "one.two.three": "value" } to { "one": { "two": { "three": "value" } } }
        - boolean: true // default: true | transform "true" and "false" enums to boolean

    example:
        SELECT * FROM accounts WHERE `username` = 'salwador'
*/

const getResult = await mysqlGet(`accounts`, {
    username: `salwador`
}, {
    array: true
});


/*
    args: (table name, values, options)

    values:
        { key: `value` } // set key = value

    options:
        - on_duplicate: [`column`] // update columns if row already exists (adds ON DUPLICATE KEY UPDATE)

    example:
        INSERT INTO accounts SET `username` = 'salwador', `edited` = '1234567890' ON DUPLICATE KEY UPDATE `edited` = '1234567890'
*/

const insertResult = await mysqlInsert(`accounts`, {
    username: `salwador`,
    edited: `1234567890`
}, {
    on_duplicate: [`edited`]
});


/*
    args: (table name, conditions, values)

    conditions:
        { key: `value` } // where key = value

    values:
        { key: `value` } // set key = value

    example:
        UPDATE accounts SET `username` = 'salwador' WHERE `id` = '1'
*/

const updateResult = await mysqlUpdate(`accounts`, { id: 1 }, {
    username: `salwador`
});


/*
    args: (table name, conditions)

    conditions:
        { key: `value` } // where key = value

    example:
        DELETE FROM accounts WHERE `id` = '1'
*/

const deleteResult = await mysqlDelete(`accounts`, { id: 1 });