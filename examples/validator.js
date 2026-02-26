import { getValidationError, isValidValue, isValidArray, isValidObject } from "bitey/validator";


/*
    arguments: (checked value, schema)
    return: boolean
    
    error message in getValidationError()

    types:
        boolean - boolean
        string - any string
        number - any number
        integer - integer number
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
            string (default: false) - if type = boolean, number, integer, float. expects a value in string

        array:
            duplicates (default: false) - duplicate identical elements in an array. true - available, false - not available
            items - array schema

        object:
            null (default: false) - null available
            entries - json entries
*/

if (!isValidObject({
    key1: `salwador`,
    key2: null,
    key3: `he-he`,
    key4: [
        1, `2`, 3, `4`
    ],
    key5: {
        hehe: true,
        haha: false
    }
}, {
    min: 3,
    entries: {
        key1: {
            required: true,
            type: `enum`, enum: [`salwador`, `eugene`]
        },
        key2: {
            required: true,
            type: `string`, min: 1, max: 128, null: true
        },
        key3: {
            type: `pattern`, pattern: `email`, max: 128
        },
        key4: {
            type: `array`, min: 1, max: 3,
            items: {
                type: `integer`, min: 1, max: 32, string: true
            }
        },
        key5: {
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
    console.log(`json error -> `, getValidationError());
};


if (!isValidArray([
    {
        key1: `salwador`,
        key2: true
    },
    {
        key1: `eugene`,
        key2: false
    }
], {
    min: 1, max: 2, duplicates: false,
    items: {
        type: `object`, min: 1,
        entries: {
            key1: {
                type: `string`, min: 1, max: 32
            },
            key2: {
                type: `boolean`
            }
        }
    }
})) {
    console.log(`array error -> `, getValidationError());
};


if (!isValidValue(`salwador-aboba`, {
    type: `string`, min: 1, max: 64
})) {
    console.log(`value error -> `, getValidationError());
};