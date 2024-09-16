/*
    Пользовательский запрос.
    В данном случае, мы получаем строку из `accounts` где username = salwador.

    Аргументы:
        - Строка запроса SQL
        - Значения:
            [ `значение` ] -  значения, которыми будут заменены `?` при запросе
        - Дополнительные параметры:
            {
                `array`: true - результат выдать в массиве даже если затронута только одна строка
            }
*/

let exe = await app.core.mysql.exe(`
    SELECT * FROM accounts WHERE username = ?
`, [`salwador`], { array: true });


/*
    GET запрос.
    В данном случае, мы получаем строку из таблицы `accounts` где `username` = 'salwador'.
    
    Аргументы:
        - Название таблицы
        - Значения:
            { key: `value` } - пары ключ-значение, вставляемые в запрос SQL
        - Дополнительные параметры:
            {
                `array`: true - результат выдать в массиве даже если затронута только одна строка
            }

    SQL выражение: "SELECT * FROM accounts WHERE `username` = 'salwador'".
*/

let get = await app.core.mysql.get(`accounts`, {
    username: `salwador`
}, {
    array: true
});


/*
    INSERT запрос.
    В данном случае, мы добавляем строку в таблицу `accounts` с значениями 'salwador' и '1234567890' в соответствующие колонки, а также проверяем проверяем дубликат строки и обновляем ключ `edited` в случае совпадения.
    
    Аргументы:
        - Название таблицы
        - Значения:
            { key: `value` } - пары ключ-значение, вставляемые в запрос SQL
        - Дополнительные параметры:
            {
                `on_duplicate`: [`column`] - обновить указанные ключи если строка уже существует (добавляет ON DUPLICATE KEY UPDATE)
            }

    SQL выражение: "INSERT INTO accounts SET `username` = 'salwador', `edited` = '1234567890' ON DUPLICATE KEY UPDATE `edited` = '1234567890'".
*/

let ins = await app.core.mysql.ins(`accounts`, {
    username: `salwador`,
    edited: `1234567890`
}, {
    on_duplicate: [`edited`]
});


/*
    UPDATE запрос.
    В данном случае, мы обновляем строку в таблице `accounts` и указываем значение 'salwadoriche' в колонке `username` где `id` = '1'.

    Аргументы:
        - Название таблицы
        - Условия:
            { key: `value` } - пары ключ-значение, вставляемые в запрос SQL
        - Значения:
            { key: `value` } - пары ключ-значение, вставляемые в запрос SQL

    SQL выражение: "UPDATE accounts SET `username` = 'salwadoriche' WHERE `id` = '1'".
*/

let upd = await app.core.mysql.upd(`accounts`, { id: 1 }, {
    username: `salwadoriche`
});


/*
    DELETE запрос.
    В данном случае, мы удаляем строку из таблицы `accounts` где `id` = '1'.
    
    Аргументы:
        - Название таблицы
        - Условия:
            { key: `value` } - пары ключ-значение, вставляемые в запрос SQL

    SQL выражение: "DELETE FROM accounts WHERE `id` = '1'".
*/

let del = await app.core.mysql.del(`accounts`, { id: 1 });