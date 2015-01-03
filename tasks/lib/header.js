var $$cache = exports.$$cache || {};
var $$internals = exports.$$internals || {};
var $$pending = exports.$$pending || {};

var define = function (name) {
    var args = Array.prototype.slice.call(arguments);
    if (typeof args[1] === 'function') {
        exports[name] = args[1]();
    } else {
        $$cache[name] = args[2];
        $$cache[name].$inject = args[1];
        $$cache[name].$internal = false;
    }
};

var internal = function (name) {
    var args = Array.prototype.slice.call(arguments);
    if (typeof args[1] === 'function') {
        $$internals[name] = args[1]();
    } else {
        $$cache[name] = args[2];
        $$cache[name].$inject = args[1];
        $$cache[name].$internal = true;
    }
};

var resolve = function (name, fn) {

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
            $$internals[name] = fn.apply(null, args) || true;
        } else {
            exports[name] = fn.apply(null, args) || true;
        }
    }

    exports.$$cache = $$cache;
    exports.$$internals = $$internals;
    exports.$$pending = $$pending;

    delete $$pending[name];
};