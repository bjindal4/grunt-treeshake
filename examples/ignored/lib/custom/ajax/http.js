/**
 * http will show up on the global namespace and can be access via:
 * demo.http()
 */
//! import each
define('http', function () {
    return function () {
        return 'http';
    };
});