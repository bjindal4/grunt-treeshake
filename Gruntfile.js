module.exports = function (grunt) {

    grunt.loadTasks('tasks');

    grunt.initConfig({
        treeshake: {
            demo: {
                options: {
                    wrap: 'demo',
                    minify: true,
                    inspect: ['example/app.js'],
                    import: ['ajax.*'],
                    report: 'verbose',
                    ignore: ['example/ignore.js']
                    //log: 'example/build/demo.log',
                    //clearLog: false,
                    //logLimit: 500
                },
                files: {
                    'example/build/demo.js': ['example/lib/**/**.js']
                }
            }
        }
    });

    grunt.registerTask('demo', 'treeshake');
};