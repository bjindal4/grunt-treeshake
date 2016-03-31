/**
 * This is just a dummy file
 */
define('isNumber', function () {
    return function (val) {
        return !isNaN(val);
    };
});