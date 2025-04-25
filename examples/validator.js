/*
    arguments: (checked value, schema)
    return: boolean
    
    error message in bitey.validator.error()

    types:
        boolean - boolean
        string - any string
        number - any number
        int, int8, int16, int32 - int number
        uint, uint8, uint16, uint32 - int number more than zero
        float - float number
        enum - array with available values
        pattern - regex pattern
        object - json object
        array - array

    options:
        general:
            required - value is required
            min - min number || min string length || min array elements || min json object keys
            max - max number || max string length || max array elements || max json object keys

        enum:
            enum - own or key from `validator.js > enums`

        pattern:
            pattern - own or key from `validator.js > patterns`

        value:
            string (default: false) - if type = boolean, int, int8, int16, int32, uint, uint8, uint16, uint32, float. expects a value in string

        array:
            duplicates (default: false) - duplicate identical elements in an array. true - available, false - not available
            items - array schema

        object:
            null (default: false) - null available
            entries - json entries
*/

if (!bitey.validator.json({
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
    entries: {
        value_enum: {
            required: true,
            type: `enum`, enum: [`salwador`, `eugene`]
        },
        value_something: {
            required: true,
            type: `string`, min: 1, max: 128, null: true
        },
        value_pattern: {
            type: `pattern`, pattern: `email`, max: 128
        },
        value_array: {
            type: `array`, min: 1, max: 3,
            items: {
                type: `int`, min: 1, max: 32, string: true
            }
        },
        value_object: {
            type: `object`, min: 1,
            entries: {
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
    console.log(`json error -> `, bitey.validator.error());
};


if (!bitey.validator.array([
    {
        name: `salwador`,
        aboba: true
    },
    {
        name: `eugene`,
        aboba: false
    }
], {
    min: 1, max: 2, duplicates: false,
    items: {
        type: `object`, min: 1,
        entries: {
            name: {
                type: `string`, min: 1, max: 32
            },
            aboba: {
                type: `boolean`
            }
        }
    }
})) {
    console.log(`array error -> `, bitey.validator.error());
};


if (!bitey.validator.value(`salwador-aboba`, {
    type: `string`, min: 1, max: 64
})) {
    console.log(`value error -> `, bitey.validator.error());
};