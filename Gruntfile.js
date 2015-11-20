module.exports = function (grunt) {

    grunt.loadTasks('tasks');

    var treeshake = {};
    treeshake.all = {
        options: {
            banner: '// Place your license here...',
            wrap: 'demo',
            minify: true,
            ignorePatterns: false,
            inspect: ['examples/all/src/app.js', 'examples/all/templates/*.html', 'examples/all/src/file-does-not-exist.js'],
            import: ['ajax.*'],
            report: 'verbose',
            exclude: ['validators.*'],
            log: 'examples/all/logs/demo.log',
            includes: ['examples/all/lib/jquery/jquery.js'],
            //ignore: ['examples/all/ignore.js'],// looks in a file for used values and then doesn't include those.
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
            'examples/all/dist/demo.js': ['examples/all/lib/**/**.js']
        }
    };

    // This is an example on how to use the most common features
    treeshake.simple = {
        options: {
            banner: '// Place your license here...',
            wrap: 'demo',
            minify: true, // create a minified file
            ignorePatterns: true,
            import: ['app'], // You always need to import at least one definition. Typically this will be the
            // the file that bootstraps your application. By referencing this file treeshake will then start
            // traversing through other referenced definitions used by the other JS files.
            log: 'examples/simple/logs/simple.log', // export a log file to this location
            report: 'verbose', // gimme the details
            includes: ['examples/simple/lib/jquery/jquery.js']
        },
        files: {
            'examples/simple/dist/demo.js': ['examples/simple/src/*.js', 'examples/simple/lib/**/*.js']
        }
    };

    // This example will not generate a file because it has a bad reference to JS files; there is nothing to inspect.
    treeshake.empty = {
        options: {
            wrap: 'demo', // this represents the global namespace
            import: ['app'] // You always need to import at least one definition. Typically this will be the
            // the file that bootstraps your application. By referencing this file treeshake will then start
            // traversing through other referenced definitions used by the other JS files.
        },
        files: {
            // this example is referencing a path where there is not JS files found
            // it should have been 'examples/empty/src/*.js'
            // Note: this is the most common mistake
            'examples/empty/dist/demo.js': ['examples/empty/*.js']
        }
    };

    grunt.initConfig({
        treeshake: treeshake
    });

    grunt.loadNpmTasks('grunt-release');

    grunt.registerTask('default', 'treeshake');
    grunt.registerTask('all', 'treeshake:all');
    grunt.registerTask('simple', 'treeshake:simple');
    grunt.registerTask('empty', 'treeshake:empty');
};