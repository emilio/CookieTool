module.exports = function(grunt) {


    var banner = '/*! <%= pkg.name %> <%= pkg.version %> (built <%= grunt.template.today("yyyy-mm-dd") %>) \n'
               + ' *  Repository: <%= pkg.repository.url %>\n'
               + ' *  Author: <%= pkg.author %>\n'
               + ' *  License: <%= pkg.license %> */'

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            build: {
                src: 'src/<%= pkg.name %>.js'
            }
        },
        uglify: {
            options: {
                banner: banner + '\n',
            },
            build: {
                src: 'src/<%= pkg.name %>.js',
                dest: 'build/<%= pkg.name %>.min.js'
            }
        },
        cssmin: {
            options: {
                banner: banner,
            },
            build: {
                src: 'src/<%= pkg.name %>.css',
                dest: 'build/<%= pkg.name %>.min.css'
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.registerTask('default', ['jshint', 'uglify', 'cssmin']);

};
