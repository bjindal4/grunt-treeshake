grunt-treeshake
=========

A grunt task used to import and compile JavaScript files referenced in your project.

The grunt-treeshake task uses a CommonJS-like syntax to define files, allowing treeshake to import only the files referenced into the build file. At runtime, the build file will initialize synchronously providing a public API to library.

For examples and documentation, visit [https://github.com/obogo/grunt-treeshake](https://github.com/obogo/grunt-treeshake).

###Getting started

This plugin requires Grunt ~0.4.0

If you haven't used Grunt before, be sure to check out the [Getting Started guide](http://gruntjs.com/getting-started), as it explains how to create a Gruntfile as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

	npm install grunt-treeshake --save-dev

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

	grunt.loadNpmTasks('grunt-treeshake');

###Grunt options

####exclude

**Type:** Array of definitions

**Default:** *undefined*

Will force ignore definitions and its dependencies from import. You can use either the name of the definition or use a directory with a wildcard. Note: if another file references the same definition, that definition will be imported. If you are excluding a particular definition. 

**Example of excluding a definition**

This will only ignore the "query" definition.

	options: {
		import: ["query.css"],
		exclude: ["query"]
	}

**Example of excluding multiple definitions with a wildcard**

This will ignore all query definitions except "query.css".

	options: {
		import: ["query.css"],
		exclude: ["query.*"]
	}


####export

**Type:** Array of definitions

**Default:** *undefined*

Exposes only the list of definitions to the api. If no list is provided, all definitions using define() will be added to the public interface.

	options: {
		export: ["http", "query"]
	}


####ignore

**Type:** Array of files or String

**Default:** *undefined*

Will exclude importing definitions from files already containing definition. This helps prevent including the same definitions twice.

	options: {
		ignore: ["build/base.js"]
	}

####import

**Type:** Array of definitions or Definition String

**Default:** *undefined*

There may be times when you want to include a definition that is not referenced in one of supported formats. This option will allow you to include a file or files if using a wildcard whether referenced in source files or not. 

	options: {
		import: ["utils.validators.*", "utils.ajax.http"]
	}

####inspect

**Type:** Array of files or String

**Default:** *undefined*

Your applications source files to know what to import into the build. Treeshake will inspect your source and look for references that match any definitions in the treeshake library files.

###match

**Type:** Function

**Default:** *undefined*

A custom function allowing you to find dependencies through your own parser. A content string is passed in as an argument. Expects an array will be returned with a list of definitions that were found.

**Example of matching in an html template**

This example is looking for the contents of a definition using dashes, and converts it to CamelCase before return the results.

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
          }	}

####minify

**Type:** Boolean

**Default:** false

Generates a minified version of you build in addition to an unminified version.

####report

**Type:** Enum (true, false, "verbose")

**Default:** false

If *true*, will report what files were included in build. If "verbose", will report the package structure, what is included (with file and line number), and excluded.

####log

**Type:** String

**Default:** "console"

If any string other than "console" is provided it will try to write to that location instead of logging to the console.

####wrap

**Type:** String

**Default:** Uses the grunt target name

Wraps all of the code in a closure, an easy way to make sure nothing is leaking. For variables that need to be public exports and global variables are made available. The value of wrap is the global variable exports will be available as.


**Example**

	treeshake: {
            demo: {
                options: {
                    wrap: 'myDemo',
                    inspect: ['demo/*.js']
                },
                files: {
                    'demo/treeshaked_lib.js': ['src/**/*.js']
                }
            }
        }


###Treeshake setup

To have your JavaScript libraries support treeshaking, each function should be wrapped in a CommonJS-like structure. It is best practice to have one definition per file.

	define('myMethod', function() {
		return function() {
			console.log('myMethod called');
		}
	});

The *define* function expects that you will return a value. Typically, it will return either a function or object.

Definitions can be referenced by other definitions:

	define('anotherMethod', ['myMethod'], function(myMethod) { ... });

These dependencies will be included automatically by treeshake during the grunt process.

Once you grunt the definitions they will be available on a global namespace you define. For our examples, we are going to use the namespace "demo", but you can call it what ever you want in the configuration.

In your application you can reference the definitions in a couple different ways:

###Referencing definitions
 		
Treeshake will find "demo.anotherMethod" *and* "demo.myMethod" and include them in the build.

	demo.anotherMethod();

Treeshake will also find these variations

	demo['anotherMethod']();  // single quote reference
	
	demo["anotherMethod"](); // double quote reference
	
	var anotherMethod = demo.anotherMethod; // alias reference
	anotherMethod();
	
	var d = demo;
	d.anotherMethod();
	
###Import using comments

There may be times when you want to include a definition that is not referenced in one of supported formats. You can include a definition using the import declaration in a comment. 

**Note:** *Use ! to inform treeshake to look in the comment*

	//! import demo.myMethod
	
	/*!
	 * import demo.myMethod
	 * import demo.someOtherMethod
	 */

	 /**!
	  ** import demo.myMethod
	  ** import demo.someOtherMethod
	  **/

**Import using wildcard**

Treeshake supports wildcard imports. The wildcard will import all files in the directory and its subdirectories regardless of whether a reference is found in the target files.

	//! import demo.utils.*

###Creating private definitions

You may have some definitions that are "extensions" of another definition and do not need to be included on the namespace's API. To hide a definition, use **internal** in place of **define**.

	internal('myPrivateMethod', [deps...], function(){});
		
It can only be referenced by other **define** or **internal** functions.

	internal('myDef', ['myPrivateMethod'], function(myPrivateMethod) {...})
		
	define('myDef', ['myPrivateMethod'], function(myPrivateMethod) {...})
	
###Using Treeshake with Hummingbird

Hummingbird is a micro framework that works similarly to AngularJS. In addition to the framework, hummingbird has several common utility libraries that can be imported via grunt-treeshake. For more information go to [https://github.com/obogo/hummingbird]().

## Contributing
grunt-treeshake is maintained by the following developers:

* Rob Taylor <roboncode@gmail.com>
* Wes Jones <cybus10@gmail.com>

## License
Copyright (c) 2014 Obogo. Licensed under the MIT license.
