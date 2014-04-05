'use strict';

var grunt = require('grunt');
var DependencyGraph = require('../tasks/lib/dependencygraph.js');

exports.preConcat = {
    cyclicGraph: function (test) {
        test.expect(1);

        var root = 'test/fixtures/cyclic';
        var files = ['a', 'b', 'c'].map(function (name) {
            return root + '/' + name + '.js';
        });
        var graph = new DependencyGraph(root.split('/'), files);

        test.throws(function () {
            graph.sort();
        }, Error, 'Cyclic dependencies detected.');

        test.done();
    },
    emptySet: function (test) {
        test.expect(1);

        var graph = new DependencyGraph(['src'], []);
        test.deepEqual(graph.sort(), []);

        test.done();
    },
    wrongId: function (test) {
        test.expect(1);

        test.throws(function () {
            new DependencyGraph(
                'test/fixtures/typo'.split('/'), [
                    'test/fixtures/typo/a.js',
                    'test/fixtures/typo/b.js'
                ]);
        }, Error, 'Invalid (not existing) dependencies.');

        test.done();
    },
    concat: function (test) {
        test.expect(1);

        var actual = grunt.file.read('tmp/correct.js');
        var expected = grunt.file.read('test/expected/correct.js');
        test.equal(actual, expected);

        test.done();
    }
};
