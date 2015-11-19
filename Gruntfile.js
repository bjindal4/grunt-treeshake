module.exports = function (grunt) {

    grunt.loadTasks('tasks');

    grunt.initConfig({
        treeshake: {
            demo: {
                options: {
                    banner: '//my banner\n',
                    wrap: 'util',
                    minify: true,
                    ignorePatterns: false,
                    inspect: ['example/app.js', 'example/templates/*.html', 'example/bogus.js'],
                    import: ['ajax.*', 'util'],
                    report: 'verbose',
                    //ignore: ['example/ignore.js'],// looks in a file for used values and then doesn't include those.
                    exclude: ['validators.*'],
                    export: [
                        'http as xp'
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
                    'example/build/demo.js': ['example/lib/**/**.js']
                }
            },
            demo2: {
                options: {
                    banner: '// ## BANNER HERE ###',
                    wrap: 'demo',
                    minify: true,
                    report: 'verbose',
                    ignorePatterns: true,
                    import: ['app'],
                    log: 'example/logs/demo2.log',
                    includes: ['example/lib/nothing.js']
                },
                files: {
                    'example/build/demo2.js': ['example/src/*.js', 'example/lib/**/*.js']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-release');

    grunt.registerTask('default', 'treeshake:demo2');
};