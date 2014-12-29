module.exports = function (grunt) {

    grunt.loadTasks('tasks');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        treeshake: {
            demo: {
                options: {
                    wrap: 'demo',
                    inspect: ['example/app.js']
                },
                files: {
                    'example/build/demo.js': ['example/lib/**/**.js']
                }
            }
        }
    });

    grunt.registerTask('demo', 'treeshake');
};