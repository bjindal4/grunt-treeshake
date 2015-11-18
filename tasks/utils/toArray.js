var isArguments = function (value) {
    var str = String(value);
    var isArguments = str === '[object Arguments]';
    if (!isArguments) {
        isArguments = str !== '[object Array]' &&
            value !== null &&
            typeof value === 'object' &&
            typeof value.length === 'number' &&
            value.length >= 0 &&
            (!value.callee || toString.call(value.callee) === '[object Function]');
    }
    return isArguments;
};

Array.prototype.__isArray = true;
Object.defineProperty(Array.prototype, "__isArray", {
    enumerable: false,
    writable: true
});

var isArray = function (val) {
    return val ? !!val.__isArray : false;
};

var toArray = function (value) {
    if (isArguments(value)) {
        return Array.prototype.slice.call(value, 0) || [];
    }
    try {
        if (isArray(value)) {
            return value;
        }
        if (value !== undefined) {
            return [].concat(value);
        }
    } catch (e) {
    }

    return [];
};

module.exports = toArray;