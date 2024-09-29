/*
    Создать хеш. Строка с длиной в 80 символов.
*/

await bitey.core.password.hash(`password`)


/*
    Сверить значение и хеш.
*/

await bitey.core.password.compare(`password`, `hash`)