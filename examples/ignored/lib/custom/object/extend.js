/**
 * isDefined will be imported automatically because it is referenced by this definition
 */
define('extend', ['isDefined'], function (isDefined) {
    return function () {
        var result = isDefined();
        console.log(result);
        return 'each';
    };
});