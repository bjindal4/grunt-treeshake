// Place your license here...
(function(exports, global) {
    global["demo"] = exports;
    var define, internal, finalize = function() {};
    (function() {
        var get, defined, pending, definitions, initDefinition, $cachelyToken = "~", $depsRequiredByDefinitionToken = ".";
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
            if (defined[name]) {
                return;
            }
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
                        if (!pending.hasOwnProperty(dependencyName)) {
                            resolve(dependencyName, definitions[dependencyName]);
                        }
                        resolve(dependencyName, definitions[dependencyName]);
                        delete definitions[dependencyName];
                    }
                }
            }
            if (!defined.hasOwnProperty(name)) {
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
    //! ################# YOUR CODE STARTS HERE #################### //
    //! examples/all/lib/custom/ajax/http.js
    define("http", function() {
        return function() {
            return "http";
        };
    });
    //! examples/all/lib/custom/ajax/jsonp.js
    internal("http.jsonp", [ "http" ], function(http) {
        return http.jsonp = function() {
            console.log("calling ", http());
            return "http.jsonp";
        };
    });
    //! examples/all/lib/custom/object/each.js
    define("each", [ "isDefined" ], function(isDefined) {
        return function() {
            if (isDefined()) {
                return "each";
            }
        };
    });
    //! examples/all/lib/custom/validators/isDefined.js
    define("isDefined", function() {
        return function(val) {
            return typeof val !== "undefined";
        };
    });
    //! examples/all/lib/custom/directives/my-test.js
    //! pattern /my\-test(\s|\=|\>)/
    define("myTest", function() {
        return function myTest() {};
    });
    //! examples/all/lib/jquery/jquery.js
    window.$ = function() {};
    //! #################  YOUR CODE ENDS HERE  #################### //
    finalize();
    return global["demo"];
})(this["demo"] || {}, function() {
    return this;
}());