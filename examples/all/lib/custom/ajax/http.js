/**
 * http will show up on the global namespace and can be access via:
 * demo.http()
 */
define('http', function () {
    return function () {
        return 'http';
    };
});