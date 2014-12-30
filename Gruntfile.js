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
                    report: true
                },
                files: {
                    'example/build/demo.js': ['example/lib/**/**.js']
                }
            }
        }
    });

    grunt.registerTask('demo', 'treeshake');
};