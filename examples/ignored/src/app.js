/**
 * This will import
 *  - each
 *  - http
 */

//! import each
define('app', ['http'], function (http) {
    exports.message = 'Hello, world!';
});