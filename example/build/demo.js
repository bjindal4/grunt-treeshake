(function(exports, global) {
    global["demo"] = exports;
    var $$cache = exports.$$cache || {};
    var $$internals = exports.$$internals || {};
    var $$pending = exports.$$pending || {};
    var define = function(name) {
        var args = Array.prototype.slice.call(arguments);
        if (typeof args[1] === "function") {
            exports[name] = args[1]();
        } else {
            $$cache[name] = args[2];
            $$cache[name].$inject = args[1];
            $$cache[name].$internal = false;
        }
    };
    var internal = function(name) {
        var args = Array.prototype.slice.call(arguments);
        if (typeof args[1] === "function") {
            $$internals[name] = args[1]();
        } else {
            $$cache[name] = args[2];
            $$cache[name].$inject = args[1];
            $$cache[name].$internal = true;
        }
    };
    var resolve = function(name, fn) {
        $$pending[name] = true;
        var injections = fn.$inject;
        var args = [];
        var injectionName;
        for (var i in injections) {
            injectionName = injections[i];
            if ($$cache[injectionName]) {
                if ($$pending.hasOwnProperty(injectionName)) {
                    throw new Error('Cyclical reference: "' + name + '" referencing "' + injectionName + '"');
                }
                resolve(injectionName, $$cache[injectionName]);
                delete $$cache[injectionName];
            }
        }
        if (!exports[name] && !$$internals[name]) {
            for (var n in injections) {
                injectionName = injections[n];
                args.push(exports[injectionName] || $$internals[injectionName]);
            }
            if (fn.$internal) {
                $$internals[name] = fn.apply(null, args) || name;
            } else {
                exports[name] = fn.apply(null, args) || name;
            }
        }
        exports.$$cache = $$cache;
        exports.$$internals = $$internals;
        exports.$$pending = $$pending;
        delete $$pending[name];
    };
    //! example/lib/ajax/http.js
    define("http", function() {
        return function() {
            return "http";
        };
    });
    //! example/lib/ajax/jsonp.js
    internal("http.jsonp", [ "http" ], function(http) {
        return http.jsonp = function() {
            console.log("calling ", http());
            return "http.jsonp";
        };
    });
    //! example/lib/object/extend.js
    define("extend", [ "isDefined" ], function(isDefined) {
        return function() {
            var result = isDefined();
            console.log(result);
            return "each";
        };
    });
    //! example/lib/validators/isDefined.js
    define("isDefined", function() {
        return function(val) {
            return typeof val !== "undefined";
        };
    });
    //! example/lib/validators/isNumber.js
    define("isNumber", function() {
        return function(val) {
            return !isNaN(val);
        };
    });
    for (var name in $$cache) {
        resolve(name, $$cache[name]);
    }
})(this["demo"] || {}, function() {
    return this;
}());