/**
 * http.jsonp is an addon to http and does not need to directly access off the
 * public namespace, therefore "internal" is used. It can be access via:
 * demo.http.jsonp()
 *
 * http will be imported automatically because it is referenced by this definition
 */
internal('http.jsonp', ['http'], function (http) {
    return http.jsonp = function () {
        console.log('calling ', http());
        return 'http.jsonp';
    };
});