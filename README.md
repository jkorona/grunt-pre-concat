# grunt-pre-concat

> Grunt.js task that prepares javascript files for concatenation by setting them in correct order using dependency tree.

## Getting Started
This plugin requires Grunt `~0.4.4`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-pre-concat --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-pre-concat');
```

## The "preConcat" task

### Overview
In your project's Gruntfile, add a section named `preConcat` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  preConcat: {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
});
```

### Options

#### options.cwd
Type: `String`
Default value: `'src'`

Current working directory for the task. During execution task generates names for each file given as source.
That name is concatenation of file path starting from `cwd` without file extension.

Example:
For file in `src/js/controllers/myController.js`, when `cwd` is `src/js`, generated file id would be `controllers.myController`.

### Usage Examples

Assume we have following javascript source files structure:
 - src
    - controllers
        - loginCtrl.js
        - mainCtrl.js
    - directives
        - labelDirective.js
        - panelDirective.js
    - services
        - backendService.js
        - loginService.js
    - utils
        - utils.js  
    - module.js

When we are using just [concat task](https://github.com/gruntjs/grunt-contrib-concat) with `src` set to `src/**/*.js` pattern, content order of output file would be :

 1. module.js 
 2. loginCtrl.js
 3. mainCtrl.js
 4. labelDirective.js
 5. panelDirective.js
 6. backendService.js
 7. loginService.js
 8. utils.js

If we want to modify order in which task concatenates source files we have to put them in required order in grunt config using full paths, which might be cumbersome as codebase grows.

Here comes _preConcat_ task, which pre-generates automatically config for [concat task](https://github.com/gruntjs/grunt-contrib-concat) using dependencies defined in special directives in source code comments.

#### Defining dependencies

To defined dependencies between files we have to add special comment with `@require <dependency_name>` at the files header. Dependency name is created from the file path starting from `cwd` with extension cut off. E.g. for `panelDirective.js` generated name would be `directives.panelDirective`.

Let's say that part of dependency tree in our example is `loginCtrl.js -> loginService.js -> module.js`. Then those file headers would have respectively:

`loginCtrl.js`
```js
// @require services.loginService
(function() {
...
})();
```
`loginService.js`
```js
// @require module
(function() {
...
})();
```

We can add as many dependencies as we want. For examples if `loginService.js` dependes, in addition, on `utils.js` we can set file header to:

```js
// @require module
// @require uitls.utils
(function() {
...
})();
```
#### Gruntfile.js

Following code snippet ilustrates sample `Gruntfile.js` configuration for example described in previous sections:

```js

module.exports = function (grunt) {
    grunt.initConfig({
        preConcat: {
            correct: {
                options: {
                    cwd: 'src'
                },
                src: 'src/**/*.js',
                dest: 'dist/script.js'
            }
        }
    });
    
    grunt.loadNpmTasks('grunt-pre-concat');
    grunt.loadNpmTasks('grunt-contrib-concat');
    
    grunt.registerTask('build', ['preConcat', 'concat']);

};

```

First of all _preConcat_ task was designed as helper for [concat task](https://github.com/gruntjs/grunt-contrib-concat). So using it without it does not make any sense. 

As _preConcat_ generates configuration for _concat_, we don't have to define it manually but _preConcat_ should be always executed before actual _concat_.

### Possible problems

#### Cyclic dependencies

This task detects situations when you defined cyclic dependency in your sources. In such cases error with detailed information is thrown.

#### Wrong dependency name

If you make typo or other mistake when declaring dependency name (e.g. `serices.loginService`), 
task will fail with appropriate error message.

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_
