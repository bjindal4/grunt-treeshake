module.exports = function (grunt) {

    grunt.loadTasks('tasks');

    grunt.initConfig({
        treeshake: {
            demo: {
                options: {
                    wrap: 'demo',
                    minify: true,
                    inspect: ['example/app.js', 'example/templates/test.html'],
                    import: ['ajax.*'],
                    report: 'verbose',
                    ignore: ['example/ignore.js'],
                    //log: 'example/build/demo.log',
                    aliases: ['directive'],
                    match: function (searchText) {
                        return [];
                        //var camelCase = function (str) {
                        //    str.replace(/-([a-z])/g, function (g) {
                        //        return g[1].toUpperCase();
                        //    });
                        //};
                        //
                        //var results = searchText.match(/my-[\w|-]+/gm);
                        ////console.log("### RESULTS ####", searchText, results);
                        //
                        //for (var e in results) {
                        //    results[e] = camelCase(results[e]);
                        //}
                        //return results || [];
                    },
                },
                files: {
                    'example/build/demo.js': ['example/lib/**/**.js']
                }
            }
        }
    });

    grunt.registerTask('default', 'treeshake');
};