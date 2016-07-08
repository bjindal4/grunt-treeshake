// Place your license here...
(function(exports, global) {
    global["demo"] = exports;
    //! examples/simple/src/app.js
    //! import each
    define("app", [ "http" ], function(http) {
        exports.message = "Hello, world!";
    });
    //! examples/simple/lib/custom/object/each.js
    define("each", [ "isDefined" ], function(isDefined) {
        return function() {
            if (isDefined()) {
                return "each";
            }
        };
    });
    //! examples/simple/lib/custom/validators/isDefined.js
    define("isDefined", function() {
        return function(val) {
            return typeof val !== "undefined";
        };
    });
    //! examples/simple/lib/custom/ajax/http.js
    define("http", function() {
        return function() {
            return "http";
        };
    });
    //! examples/simple/lib/jquery/jquery.js
    window.$ = function() {};
})(this["demo"] || {}, function() {
    return this;
}());