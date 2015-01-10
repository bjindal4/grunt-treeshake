module.exports = function (grunt) {

    grunt.loadTasks('tasks');

    grunt.initConfig({
        treeshake: {
            demo: {
                options: {
                    wrap: 'util',
                    minify: true,
                    inspect: ['example/app.js', 'example/templates/*.html', 'example/bogus.js'],
                    import: ['ajax.*', 'util'],
                    report: 'verbose',
                    //ignore: ['example/ignore.js'],// looks in a file for used values and then doesn't include those.
                    exclude: ['validators.*'],
                    export: [
                        'http',
                        'http.json:jsonp',
                        'http.json'
                    ],
                    log: 'example/logs/demo.log',
                    includes: ['example/lib/nothing.js'],
                    //match: function (searchText) {
                    //    var camelCase = function (str) {
                    //        return str.replace(/-([a-z])/g, function (g) {
                    //            return g[1].toUpperCase();
                    //        });
                    //    };
                    //    return;
                    //    var results = searchText.match(/my-[\w|-]+/gm);
                    //
                    //    for (var e in results) {
                    //        results[e] = camelCase(results[e]);
                    //    }
                    //    return results;
                    //},
                },
                files: {
                    'example/build/demo.js': ['example/lib/**/**.js', 'example/lib/**/**.js']
                }
            }
        }
    });

    grunt.registerTask('default', 'treeshake');
};