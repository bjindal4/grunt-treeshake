// treeshake-header:start //
var define, internal, finalize;
(function () {
    var get, defined, pending, initDefinition,
        $cachelyToken = '~',
        $depsRequiredByDefinitionToken = '.';

    /**
     * Sets and Gets cache, defined, and pending items in a private internal cache
     */
    get = Function[$cachelyToken] = Function[$cachelyToken] || function (name) {
            if (!get[name]) {
                get[name] = {};
            }
            return get[name];
        };

    definitions = get('c'); // these are items that have been initialized and permanently cached
    defined = get('d'); // these are items that have been defined but have not been initialized
    pending = get('p'); // these are items that have been initialized but have deps that need initialized before done

    /**
     * Initializes
     */
    initDefinition = function (name) {
        var args = arguments;
        var val = args[1];
        if (typeof val === 'function') {
            // ex. define('myFunc', function(){...});
            defined[name] = val(); // invoke immediately and assign to defined
        } else {
            // store in a temporary definitions until all definitions have been processed
            // ex. define('myFunc', ['toBoolean'], function(toBoolean){...})
            definitions[name] = args[2]; // skip array and assign funtion to cached name
            definitions[name][$depsRequiredByDefinitionToken] = val; // assign dependencies to definitions on function itself
        }
    };

    /**
     * define(); internal is deprecated
     */
    define = internal = function () {
        initDefinition.apply(null, arguments);
    };

    resolve = function (name, fn) {
        pending[name] = true; // mark this definition as pending
        var deps = fn[$depsRequiredByDefinitionToken]; // get any dependencies required by definition
        var args = [];
        var i, len;
        var dependencyName;
        if (deps) {
            len = deps.length;
            for (i = 0; i < len; i++) {
                dependencyName = deps[i];
                if (definitions[dependencyName]) {
                    if (pending.hasOwnProperty(dependencyName)) {
                        throw new Error('Cyclical reference: "' + name + '" referencing "' + dependencyName + '"');
                    }
                    resolve(dependencyName, definitions[dependencyName]);
                    delete definitions[dependencyName];
                }
            }
        }


        if (!defined[name]) { // if the item has not been defined
            for (i = 0; i < len; i++) { // loop through dependencies
                dependencyName = deps[i]; // get the dependency name
                args.push(defined.hasOwnProperty(dependencyName) && defined[dependencyName]); // this will push an item even if it is undefined
            }
            defined[name] = fn.apply(null, args); // call the function and assign return value onto defined list
        }

        delete pending[name]; // permanently remove pending item
    };

    finalize = function () {
        for (var name in definitions) {
            resolve(name, definitions[name]);
        }
    };

    return define;
}());

// treeshake-header:end //
