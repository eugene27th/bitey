/*
    Для работы авторизации требуется таблица `accounts` с полями id(int) и permission(tinyint) (0 зарезервирован под "бан").
    После авторизации сессия доступна в req.session (аккаунт доступен в req.session.account).
*/


/*
    Создать сессию.
    В третьем аргументе передаётся информация, которая сохранится в сессии и будет доступна в req.session.
*/

await bitey.core.session.create(res, req, {
    id: account.id // id аккаунта. требуется для работы авторизации.
    // всё остальное по вкусу
});


/*
    Отредактировать сессию. 
*/

await bitey.core.session.edit(req, {
    something: `parameters`
});


/*
    Закрыть сессию.
*/

await bitey.core.session.close(res, req);