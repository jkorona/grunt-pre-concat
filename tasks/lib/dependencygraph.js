'use strict';

var grunt = require('grunt');
var _ = require('lodash');
var fs = grunt.file;

var log = grunt.log.writeln;

//-----------------------------------------------
// Private Functions
//-----------------------------------------------
// removes file extension from the file path
var stripExt = function stripExt(fileName) {
    return fileName.substr(0, fileName.lastIndexOf('.'));
};

// collects dependencies of given files using @required meta-tag
var collectDependencies = function collectDependencies(source) {
    var REQUIRE_REG_EXP = /@require\s+((?:\w+)(?:.\w+)*)/g,
        matches = [],
        match;
    while (match = REQUIRE_REG_EXP.exec(source)) {
        matches.push(match[1]);
    }
    return matches;
};

var verifyGraph = function verifyGraph(graph) {
    var errorMessage = '';

    _.each(graph, function (node) {
        var invalidDependencies = [];
        _.each(node.dependencies, function (dependency) {
            if (!_.has(graph, dependency)) {
                invalidDependencies.push(dependency);
            }
        });
        if (invalidDependencies.length) {
            errorMessage += '\t' + node.id + ' => ' + invalidDependencies.join(', ') + ';\n';
        }
    });

    if (!_.isEmpty(errorMessage)) {
        throw new Error('Invalid (not existing) dependencies: \n' + errorMessage);
    }

};

//-----------------------------------------------
// Constructor
//-----------------------------------------------

var DependencyGraph = module.exports = function DependencyGraph(root, src) {
    // build graph
    this.graph = _.reduce(fs.expand({nonull: true}, src), function (graph, filePath) {
        var fileId = stripExt(filePath).split('/').filter(function (part) {
            return !_.contains(root, part) || _.isEmpty(part);
        }).join('.');
        var content = fs.read(filePath);
        var dependencies = collectDependencies(content);
        graph[fileId] = {
            id: fileId,
            filePath: filePath,
            dependencies: dependencies
        };
        return graph;
    }, {});
    verifyGraph(this.graph);
};

//-----------------------------------------------
// Public Functions
//-----------------------------------------------

DependencyGraph.prototype = {
    print: function () {
        grunt.log.writeln(JSON.stringify(this.graph));
    },
    detectCycles: function () {
        var graph = _.clone(this.graph, true),
            index = 0,
            cycles = [],
            s = [];

        function strongconnect(node) {
            node.index = node.lowlink = index++;
            s.push(node);

            _.each(node.dependencies, function (subnodeId) {
                var subnode = graph[subnodeId];
                if (_.isUndefined(subnode.index)) {
                    strongconnect(subnode);
                    node.lowlink = Math.min(node.lowlink, subnode.lowlink);
                } else if (~s.indexOf(subnode)) {
                    node.lowlink = Math.min(node.lowlink, subnode.index);
                }
            });

            if (node.lowlink === node.index) {
                var scp = [], subnode;
                do {
                    subnode = s.pop();
                    scp.push(subnode.id);
                } while (node !== subnode);
                if (scp.length > 1) {
                    cycles.push(scp);
                }
            }
        }

        _.each(graph, function (node) {
            if (_.isUndefined(node.index)) {
                strongconnect(node);
            }
        });

        return cycles;
    },
    sort: function () {
        var sorted = [];
        var nodes = _.groupBy(_.clone(this.graph, true), function (node) {
            return node.dependencies.length ? 'noempty' : 'empty'
        });
        while (nodes['empty'].length) {
            var node = nodes['empty'].shift();
            sorted.push(node);
            _.each(nodes['noempty'], function (n) {
                var index = n.dependencies.indexOf(node.id);
                if (~index) {
                    n.dependencies.splice(index, 1);
                    if (!n.dependencies.length) {
                        nodes['empty'].push(n);
                    }
                }
            });
        }
        if (_.some(nodes['noempty'], function (node) {
            return !!node.dependencies.length;
        })) {
            var cycles = this.detectCycles();
            throw new Error('Cyclic dependencies detected :\n' +
                _.reduce(cycles, function (message, cycle, index) {
                    message += '\t' + (index + 1) + ') ' + cycle.join(' -> ') + '\n';
                    return message;
                }, ''));
        }
        return sorted;
    }
};

