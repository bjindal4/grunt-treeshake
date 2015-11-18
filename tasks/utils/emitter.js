var apply = function (func, scope, args) {
    if (!isFunction(func)) {
        return;
    }
    args = args || [];
    switch (args.length) {
        case 0:
            return func.call(scope);
        case 1:
            return func.call(scope, args[0]);
        case 2:
            return func.call(scope, args[0], args[1]);
        case 3:
            return func.call(scope, args[0], args[1], args[2]);
        case 4:
            return func.call(scope, args[0], args[1], args[2], args[3]);
        case 5:
            return func.call(scope, args[0], args[1], args[2], args[3], args[4]);
        case 6:
            return func.call(scope, args[0], args[1], args[2], args[3], args[4], args[5]);
    }
    return func.apply(scope, args);
};

var isFunction = function (val) {
    return typeof val === 'function';
};

function Event(type) {
    this.type = type;
    this.defaultPrevented = false;
    this.propagationStopped = false;
    this.immediatePropagationStopped = false;
}

Event.prototype.preventDefault = function () {
    this.defaultPrevented = true;
};
Event.prototype.stopPropagation = function () {
    this.propagationStopped = true;
};
Event.prototype.stopImmediatePropagation = function () {
    this.immediatePropagationStopped = true;
};
Event.prototype.toString = function () {
    return this.type;
};

function validateEvent(e) {
    if (!e) {
        throw Error('event cannot be undefined');
    }
}

var dispatcher = function (target, scope, map) {
    // if you try to make the same item a dispatcher, it will just do nothing.
    if (target && target.on && target.on.dispatcher) {
        return target;// it is already a dispatcher.
    }
    target = target || {};
    var listeners = {};

    /**
     * ###off###
     * removeEventListener from this object instance. given the event listened for and the callback reference.
     * @param event
     * @param callback
     */
    function off(event, callback) {
        validateEvent(event);
        var index, list;
        list = listeners[event];
        if (list) {
            if (callback) {
                index = list.indexOf(callback);
                if (index !== -1) {
                    list.splice(index, 1);
                }
            } else {
                list.length = 0;
            }
        }
    }

    /**
     * ###on###
     * addEventListener to this object instance.
     * @param {String} event
     * @param {Function} callback
     * @returns {Function} - removeListener or unwatch function.
     */
    function on(event, callback) {
        if (isFunction(callback)) {
            validateEvent(event);
            listeners[event] = listeners[event] || [];
            listeners[event].push(callback);
            return function () {
                off(event, callback);
            };
        }
    }

    on.dispatcher = true;

    /**
     * ###once###
     * addEventListener that gets remove with the first call.
     * @param event
     * @param callback
     * @returns {Function} - removeListener or unwatch function.
     */
    function once(event, callback) {
        if (isFunction(callback)) {
            validateEvent(event);
            function fn() {
                off(event, fn);
                apply(callback, scope || target, arguments);
            }

            return on(event, fn);
        }
    }

    /**
     * ###getListeners###
     * get the listeners from the dispatcher.
     * @param {String} event
     * @param {Boolean} strict
     * @returns {*}
     */
    function getListeners(event, strict) {
        validateEvent(event);
        var list, a = '*';
        if (event || strict) {
            list = [];
            if (listeners[a]) {
                list = listeners[a].concat(list);
            }
            if (listeners[event]) {
                list = listeners[event].concat(list);
            }
            return list;
        }
        return listeners;
    }

    function removeAllListeners() {
        listeners = {};
    }

    /**
     * ###fire###
     * fire the callback with arguments.
     * @param {Function} callback
     * @param {Array} args
     * @returns {*}
     */
    function fire(callback, args) {
        return callback && apply(callback, target, args);
    }

    /**
     * ###dispatch###
     * fire the event and any arguments that are passed.
     * @param {String} event
     */
    function dispatch(event) {
        validateEvent(event);
        var list = getListeners(event, true), len = list.length, i, event = typeof event === 'object' ? event : new Event(event);
        if (len) {
            arguments[0] = event;
            for (i = 0; i < len; i += 1) {
                if (!event.immediatePropagationStopped) {
                    fire(list[i], arguments);
                }
            }
        }
        return event;
    }

    if (scope && map) {
        target.on = scope[map.on] && scope[map.on].bind(scope);
        target.off = scope[map.off] && scope[map.off].bind(scope);
        target.once = scope[map.once] && scope[map.once].bind(scope);
        target.dispatch = target.fire = scope[map.dispatch].bind(scope);
    } else {
        target.on = on;
        target.off = off;
        target.once = once;
        target.dispatch = target.fire = dispatch;
    }
    target.getListeners = getListeners;
    target.removeAllListeners = removeAllListeners;

    return target;
};

module.exports = dispatcher();