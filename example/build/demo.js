(function(exports, global) {
    global["util"] = exports;
    var $$ = function(name) {
        if (!$$[name]) {
            $$[name] = {};
        }
        return $$[name];
    };
    var cache = $$("c");
    var internals = $$("i");
    var pending = $$("p");
    exports.$$ = $$;
    var toArray = function(args) {
        return Array.prototype.slice.call(args);
    };
    var _ = function(name) {
        var args = toArray(arguments);
        var val = args[1];
        if (typeof val === "function") {
            this.c[name] = val();
        } else {
            cache[name] = args[2];
            cache[name].$inject = val;
            cache[name].$internal = this.i;
        }
    };
    var define = function() {
        _.apply({
            i: false,
            c: exports
        }, toArray(arguments));
    };
    var internal = function() {
        _.apply({
            i: true,
            c: internals
        }, toArray(arguments));
    };
    var resolve = function(name, fn) {
        pending[name] = true;
        var injections = fn.$inject;
        var args = [];
        var injectionName;
        for (var i in injections) {
            if (injections.hasOwnProperty(i)) {
                injectionName = injections[i];
                if (cache[injectionName]) {
                    if (pending.hasOwnProperty(injectionName)) {
                        throw new Error('Cyclical reference: "' + name + '" referencing "' + injectionName + '"');
                    }
                    resolve(injectionName, cache[injectionName]);
                    delete cache[injectionName];
                }
            }
        }
        if (!exports[name] && !internals[name]) {
            for (var n in injections) {
                injectionName = injections[n];
                args.push(exports[injectionName] || internals[injectionName]);
            }
            if (fn.$internal) {
                internals[name] = fn.apply(null, args) || name;
            } else {
                exports[name] = fn.apply(null, args) || name;
            }
        }
        Object.defineProperty(exports, "$$", {
            enumerable: false,
            writable: false
        });
        delete pending[name];
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
    //! example/lib/object/util.js
    internal("util", function() {});
    //! example/lib/object/each.js
    internal("each", [ "util.test" ], function() {
        return function() {
            return "each";
        };
    });
    //! example/lib/object/test.js
    internal("util.test", function() {});
    //! example/lib/nothing.js
    function nothing() {}
    for (var name in cache) {
        resolve(name, cache[name]);
    }
})(this["util"] || {}, function() {
    return this;
}());