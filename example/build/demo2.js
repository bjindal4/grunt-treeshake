// ## BANNER HERE ###
(function(exports, global) {
    global["demo"] = exports;
    var define, internal, finalize;
    (function() {
        var get, defined, pending, initDefinition, $cachelyToken = "~", $depsRequiredByDefinitionToken = ".";
        get = Function[$cachelyToken] = Function[$cachelyToken] || function(name) {
            if (!get[name]) {
                get[name] = {};
            }
            return get[name];
        };
        definitions = get("c");
        defined = get("d");
        pending = get("p");
        initDefinition = function(name) {
            var args = arguments;
            var val = args[1];
            if (typeof val === "function") {
                defined[name] = val();
            } else {
                definitions[name] = args[2];
                definitions[name][$depsRequiredByDefinitionToken] = val;
            }
        };
        define = internal = function() {
            initDefinition.apply(null, arguments);
        };
        resolve = function(name, fn) {
            pending[name] = true;
            var deps = fn[$depsRequiredByDefinitionToken];
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
            if (!defined[name]) {
                for (i = 0; i < len; i++) {
                    dependencyName = deps[i];
                    args.push(defined.hasOwnProperty(dependencyName) && defined[dependencyName]);
                }
                defined[name] = fn.apply(null, args);
            }
            delete pending[name];
        };
        finalize = function() {
            for (var name in definitions) {
                resolve(name, definitions[name]);
            }
        };
        return define;
    })();
    //! example/src/app.js
    //! import each
    define("app", [ "http" ], function(http) {
        exports.message = "Hello, world!";
    });
    //! example/lib/object/each.js
    define("each", [ "util.test" ], function() {
        return function() {
            return "each";
        };
    });
    //! example/lib/object/test.js
    define("util.test", function() {});
    //! example/lib/ajax/http.js
    define("http", function() {
        return function() {
            return "http";
        };
    });
    //! example/lib/nothing.js
    function nothing() {}
    finalize();
})(this["demo"] || {}, function() {
    return this;
}());