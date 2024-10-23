/*
    Возвращаемые значения: true - проверка пройдена, false - не пройдена.
    Описание ошибки в `bitey.core.validator.error()`.

    Типы:
        string - любая строка.
        boolean - boolean, 'true' (string), 'false' (string).
        int, int8, int16, int32 - целые числа.
        uint, uint8, uint16, uint32 - целые числа больше нуля.
        float - с плавающей запятой.
        enum - одно из предложенных значений. можно указать как и свой массив с значениями, так и название заготовленного (смотреть файл /core/validator.js > enums).
        pattern - проверка pattern. можно указать как свой regex паттерн, так и название заготовленного (смотреть файл /core/validator.js > patterns).
        object - json объект.
        array - массив.

    Параметры:
        общие:
            required - значение требуется.
            min - минимальное значение. в случае с числами - значение, строками - длина, массивами - кол-во элементов, объектами - кол-во ключей.
            max - максимальное значение. в случае с числами - значение, строками - длина, массивами - кол-во элементов, объектами - кол-во ключей.

        enum:
            enum - свой массив с значениями или название заготовленного.

        pattern:
            pattern - свой regex паттерн или название заготовленного.

        array:
            duplicates - повторение одинаковых элементов в массиве. true - разрешено, false - запрещено. по-умолчанию: true.
            items - описание разрешённых значений в массиве (смотреть в примере).
        
        object:
            null - разрешён null в качестве.
            properties - объект, в котором указываются ключи проверяемого объекта (смотреть в примере).
*/


/*
    Проверка объекта.
*/

if (!bitey.core.validator.json({
    value_enum: `salwador`,
    value_something: null,
    value_pattern: `he-he`,
    value_array: [
        1, 2, 3
    ],
    value_object: {
        hehe: true,
        haha: false
    }
}, {
    min: 3,
    properties: {
        value_enum: {
            required: true,
            type: `enum`,
            enum: [`salwador`, `eugene`]
        },
        value_something: {
            required: true,
            type: `string`,
            min: 1, max: 128,
            null: true
        },
        value_pattern: {
            type: `pattern`,
            pattern: `email`,
            max: 128
        },
        value_array: {
            type: `array`,
            min: 1, max: 3,
            items: {
                type: `int`,
                min: 1, max: 32
            }
        },
        value_object: {
            type: `object`,
            min: 1,
            properties: {
                hehe: {
                    type: `boolean`
                },
                haha: {
                    type: `boolean`
                }
            }
        }
    }
})) {
    console.log(`json error -> `, bitey.core.validator.error());
};


/*
    Проверка массива.
*/

if (!bitey.core.validator.array([
    {
        name: `salwador`,
        aboba: true
    },
    {
        name: `eugene`,
        aboba: false
    }
], {
    min: 1, max: 2,
    duplicates: false,
    items: {
        type: `object`,
        min: 1,
        properties: {
            name: {
                type: `string`,
                min: 1, max: 32
            },
            aboba: {
                type: `boolean`
            }
        }
    }
})) {
    console.log(`array error -> `, bitey.core.validator.error());
};


/*
    Проверка значения.
*/

if (!bitey.core.validator.value(`salwador-aboba`, {
    type: `string`,
    min: 1, max: 64
})) {
    console.log(`value error -> `, bitey.core.validator.error());
};