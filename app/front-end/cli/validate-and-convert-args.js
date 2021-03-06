const errors = require("../../utils/errors");
const types = require("../../utils/types");
const paramsConfigs = require("./params-config").paramsConfigs;
const provideDefaultValues
    = require("./provide-default-values").provideDefaultValues;

/**
 * Validates and converts the list of application's arguments.
 * @param {import("../../utils/types").arg[]} args
 * @param {string[]} contents
 * @returns {object} An object with a method to process the list
 *  of validated and converted arguments further
 */
exports.validateAndConvertArgs = function (args, contents) {
    if (!types.isNaturalOrZero(arguments.length)) {
        throw errors.createUnexpectedArgumentsVariableTypeError();
    } else if (arguments.length < 2) {
        throw errors.createTooLittleArgumentsError(arguments.length);
    } else if (arguments.length > 2) {
        throw errors.createTooManyArgumentsError(arguments.length);
    }

    if (!Array.isArray(args) || !args.every((a) => types.isArg(a))) {
        throw errors.createInvalidArgumentTypeError(args);
    }

    if (!Array.isArray(contents) || !contents.every((c) => types.isString(c))) {
        throw errors.createInvalidArgumentTypeError(contents);
    }

    // Check whether all provided arguments are valid parameters' names/values
    args.forEach(a => {
        const paramConfig = paramsConfigs[a.name];

        if (paramConfig === undefined) {
            throw errors.createInvalidParamNameError(a.name);
        } else if (a.values.length !== paramConfig.validationFuncs.length) {
            throw errors.createInvalidNumberOfParamValuesError(
                a.name, a.values.length, paramConfig.validationFuncs.length
            );
        }

        paramConfig.validationFuncs.forEach(
            /**
             * @param {function} f
             * @param {import("../../utils/types").naturalOrZero} i
             */
            (f, i) => {
                if (f(a.values[i]) === false) {
                    throw errors.createInvalidParamValueError(
                        a.name, a.values[i]
                    );
                }
            }
        );
    });

    // Check whether all required parameters are provided
    // Thanks to https://stackoverflow.com/a/14379304
    for (let [paramName, paramConfig] of Object.entries(paramsConfigs)) {
        if (paramConfig.isRequired === true
            && args.find(x => (x.name === paramName)) === undefined) {
            throw errors.createRequiredParamNotProvidedError(paramName);
        }
    }

    // Convert the arguments
    const result = args.map((a) => {
        return {
            name: a.name,
            values:
                a.values.map((v, i) =>
                    paramsConfigs[a.name].convertionFuncs[i](v)
                )
        };
    });

    return {
        provideDefaultValues: () => provideDefaultValues(result, contents)
    };
};