/*
    Возвращаемое значение функций: boolean. true - проверка пройдена, false - не пройдена.
    Описание ошибки в `validator.error()`.

    Схемы проверки:
        Значение: {
            type: `string`, // обязательно. требуемый тип значения. все доступные типы и их параметры указаны в `validator.types`
            min: 1, // длина/значение
            max: 32, // длина/значение
            enums: [`salwador`, `aboba`] // массив разрешённых значений
        }

        Массив: {
            min: 1,
            max: 32,
            duplicates: false, // повторение одинаковых элементов запрещено. по-умолчанию: true.
            items: {
                type: `string`, // значение, массив, объект
                min: 1,
                max: 32
            }
        }

        Объект: {
            min: 1,
            max: 2,
            properties: {
                key: {
                    required: true, // требуется
                    null: true, // разрешён null в качестве значения

                    type: `string`, // значение, массив, объект
                    min: 1,
                    max: 32
                }
            }
        }
*/


/*
    Проверка объекта.
*/

if (!app.core.validator.json({
    username: `salwador`,
    password: null,
    something: `he-he`,
    somearray: [
        1, 2, 3
    ],
    someobject: {
        hehe: true,
        haha: false
    }
}, {
    min: 1,
    properties: {
        username: {
            required: true,
            type: `pat_string_default`,
            min: 1,
            max: 128,
            enums: [`salwador`, `eugene`]
        },
        password: {
            required: true,
            null: true,
            type: `pat_password`,
            min: 1,
            max: 128
        },
        something: {
            type: `string`,
            min: 1,
            max: 64
        },
        somearray: {
            type: `array`,
            min: 1,
            max: 3,
            items: {
                type: `integer`,
                min: 1,
                max: 32
            }
        },
        someobject: {
            type: `object`,
            min: 1,
            properties: {
                hehe: {
                    required: true,
                    type: `boolean`
                },
                haha: {
                    type: `boolean`
                }
            }
        }
    }
})) {
    console.log(`json error -> `, app.core.validator.error());
};


/*
    Проверка массива.
*/

if (!app.core.validator.array([
    {
        name: `salwador`,
        aboba: true
    },
    {
        name: `eugene`,
        aboba: false
    }
], {
    min: 1,
    max: 2,
    duplicates: false,
    items: {
        type: `object`,
        min: 1,
        properties: {
            name: {
                type: `string`,
                min: 1,
                max: 32
            },
            aboba: {
                type: `boolean`
            }
        }
    }
})) {
    console.log(`array error -> `, app.core.validator.error());
};


/*
    Проверка значения.
*/

if (!app.core.validator.value(`salwador-aboba`, {
    type: `string`,
    min: 1,
    max: 64
})) {
    console.log(`value error -> `, app.core.validator.error());
};