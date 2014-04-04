/*
 * grunt-pre-concat
 * https://github.com/jkorona/grunt-pre-concat
 *
 * Copyright (c) 2014 Jan Korona
 * Licensed under the MIT license.
 */
module.exports = function (grunt) {
    'use strict';

    var _ = require('lodash');
    var DependencyGraph = require('./lib/dependencygraph.js');

    var DEFAULT_OPTIONS = {
        rootDir: 'src'
    };

    grunt.registerMultiTask('preConcat', 'Builds list of files to concat in order based on the dependencies tree', function () {
        var options = this.options(DEFAULT_OPTIONS),
            rootDir = options.rootDir.split('/'),
            target = this.target,
            concatConfig = grunt.config('concat') || {};

        this.files.forEach(function (subject) {
            var dependencyGraph = new DependencyGraph(rootDir, subject.src);
            var sortedNodes = dependencyGraph.sort();
            concatConfig[target] = {
                src: _.pluck(sortedNodes, 'filePath'),
                dest: subject.dest
            };
        });

        grunt.verbose.subhead('Generated `concat` config: ')
            .writeln(JSON.stringify(concatConfig, null, 3));

        grunt.config('concat', concatConfig);

    });
};
