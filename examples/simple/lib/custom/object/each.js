/**
 * This file exists only to show the usage of imports
 */
define('each', ['isDefined'], function (isDefined) {
    return function () {
        if (isDefined()) {
            return 'each';
        }
    };
});