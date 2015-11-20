grunt-treeshake
=========

**Version 1.2.x**

A grunt task used to import and compile JavaScript files referenced in your project.

The **grunt-treeshake** task uses a CommonJS-like syntax to define files, allowing **grunt-treeshake** to import only the files referenced into the build file. At runtime, the build file will initialize synchronously providing a public API to library.

For examples and documentation, visit [https://github.com/obogo/grunt-treeshake](https://github.com/obogo/grunt-treeshake).

### Getting started

This plugin requires Grunt ~0.4.0

If you haven't used Grunt before, be sure to check out the [Getting Started Guide](http://gruntjs.com/getting-started), as it explains how to create a Gruntfile as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```console
npm install grunt-treeshake --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-treeshake');
```

### Treeshake options

#### exclude

**Type:** Array[] of Strings (definitions)

**Default:** *undefined*

Will force ignore definitions and its dependencies from import. You can use either the name of the definition or use a directory with a wildcard ( * ). 

**Note:** If another file references the same definition, that definition will be imported. If you are excluding a particular definition. 

**Example of excluding multiple definitions with a wildcard**

This will ignore all query definitions except "query.css".

```js
options: {
	import: ["query.css"],
	exclude: ["query.*"]
}
```

#### ignore

**Type:** Array[] of Strings, String (file paths)

**Default:** *undefined*

Will exclude importing definitions from files already containing definition. This helps prevent including the same definitions twice. For example, let's say you have a base JS file that has some validator functions. Rather than compiling those same validators in other files, just point that base file and they will not be included in your other dependency files.

```js
options: {
	ignore: ["build/base.js"]
}
```
### ignorePatterns

**Type:** Boolean

**Default:** false

Should **grunt-treeshake** ignore default patterns.

#### import

**Type:** Array[] of Strings, String (definitions)

**Default:** *undefined*

There may be times when you want to include a definition that is not directly referenced in one of supported *grunt-treeshaker* formats. This option will allow you to include a file or files if using a wildcard ( * ) whether referenced in source files or not. 

```js
options: {
	import: ["utils.validators.*", "utils.ajax.http"]
}
```	
#### include

Forces files to be injected into the compilation. This is may be useful if you wanted to include another framework like jQuery or Underscore.

```js
options: {
	includes: ['bower_components/jquery/dist/jquery.min.js']}
```

### match

**Type:** Function

**Default:** *undefined*

A custom function allowing you to find dependencies through your own parser. A content string is passed in as an argument. Expects an array will be returned with a list of definitions that were found.

**Example of matching in an html template**

This example is looking for the contents of a definition using dashes, and converts it to CamelCase before return the results.

```js
options: {
    match: function(content) {
        var camelCase = function (str) {
            return str.replace(/-([a-z])/g, function (g) {
                return g[1].toUpperCase();
            });
        };

        var results = searchText.match(/my-[\w|-]+/gm);

        for (var e in results) {
            results[e] = camelCase(results[e]);
        }
        return results;		
    }}
```

#### minify

**Type:** Boolean

**Default:** false

Generates a minified version of you build in addition to an unminified version.

```js
options: {
	minify: true}
```

#### report

**Type:** Enum (true, false, "verbose")

**Default:** false

If *true*, will report what files were included in build. If "verbose", will report the package structure, what is included (with file and line number), and excluded.

```js
options: {
	report: true}
```

#### log

**Type:** String

**Default:** "console"

If any string other than "console" is provided it will try to write to that location instead of logging to the console.

```js
options: {
	log: true}
```

#### wrap

**Type:** String

**Default:** Uses the grunt target name

Wraps all of the code in a closure, an easy way to make sure nothing is leaking. For variables that need to be public exports and global variables are made available. The value of wrap is the global variable exports will be available as.

```js
treeshake: {
    demo: {
        options: {
            wrap: 'myDemo',
            inspect: ['demo*.js']
        },
        files: {
            'demo/myapp.js': ['src/**/*.js']
        }
    }
}
```

#### Treeshake files

**Type:** Array [] of Strings

**Default:** *undefined*

Your applications source files to know what to import into the build. **grunt-treeshake** will through any files that match your patterns.

```js
treeshake: {
    demo: {
        options: {
            wrap: 'myDemo',
            inspect: ['demo*.js']
        },
        files: {
            'demo/myapp.js': ['src/**/*.js']
        }
    }
}
```

### Treeshake setup

To have your JavaScript libraries support **grunt-treeshake**, each function should be wrapped in a CommonJS-like structure. It is best practice to have one definition per file.

```js
define('myMethod', function() {
    return function() {
        console.log('myMethod called');
    }
});
```

The *define* function expects that you will return a value. Typically, it will return either a function or object.

Definitions can be referenced by other definitions:

```js
define('anotherMethod', ['myMethod'], function(myMethod) { ... });
```

These dependencies will be included automatically by **grunt-treeshake** during the grunt process.

Once you grunt the definitions they will be available on a global namespace you define. For our examples, we are going to use the namespace "demo", but you can call it what ever you want in the configuration.

In your application you can reference the definitions in a couple different ways:

### Referencing definitions
 		
**grunt-treeshake** will find "demo.anotherMethod" *and* "demo.myMethod" and include them in the build.

```js
demo.anotherMethod();
```

**grunt-treeshake** will also find these variations

```js
demo['anotherMethod']();  // single quote reference
	
demo["anotherMethod"](); // double quote reference
	
var anotherMethod = demo.anotherMethod; // alias reference
anotherMethod();
	
var d = demo;
d.anotherMethod();
```

### Import using comments

There may be times when you want to include a definition that is not referenced in one of supported formats. You can include a definition using the import declaration in a comment. 

**Note:** *Use ! to inform treeshake to look in the comment*

```js
//! import demo.myMethod

/*!
 * import demo.myMethod
 * import demo.someOtherMethod
 */

/**!
 ** import demo.myMethod
 ** import demo.someOtherMethod
 **/
```

**Import using wildcard**

Treeshake supports wildcard imports. The wildcard will import all files in the directory and its subdirectories regardless of whether a reference is found in the target files.

```js
//! import demo.utils.*
```

### Using Treeshake with Hummingbird

Hummingbird is a micro framework that works similarly to AngularJS 1.x. In addition to the framework, Hummingbird has several common and unique libraries that can be imported as utility functions via **grunt-treeshake**. For more information go to [https://github.com/obogo/hummingbird](https://github.com/obogo/hummingbird).

## Contributing
grunt-treeshake is maintained by the following developers:

* Rob Taylor <roboncode@gmail.com>
* Wes Jones <cybus10@gmail.com>

## License
Copyright (c) 2014-2015 Obogo. Licensed under the MIT license.
