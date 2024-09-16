/*
    Получить из кэша значение по ключу `account:username=salwador`.
*/

let getkey = app.core.cache.get(`account:username=salwador`);


/*
    Получить из кэша значение по директории `account:`.
*/

let getdir = app.core.cache.get(`account:`);


/*
    Установить значение ключам `account:id=1` и `account:username=salwador` на 300 секунд (по-умолчанию: 7200 секунд).
    Если указывается несколько ключей, то им присваивается одна и та же ячейчка памяти, тем самым, экономя память.
    
    Префикс перед `:` означает директорию, к которой будет относиться ключ. Директория по-умолчанию: `default`.
*/

let set = app.core.cache.set([`account:id=1`, `account:username=salwador`], {
    username: `salwador`,
    password: `aboba`
}, 300);


/*
    Удалить директорию `accounts`. Если указана директория (`accounts:`), то будут удалены все ключи с префиксом этой директории (`accounts:`).

    Удалить ключ `account:id=1` и удалить все его дубликаты.
    Если во втором аргументе функции указано `true`, то будут удалены все ключи с таким же значением.
*/

let del = app.core.cache.del([`accounts:`, `account:id=1`], true);