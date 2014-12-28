grunt-treeshake
=========

A grunt task used to import and compile JavaScript files referenced in your project.

The grunt-treeshake task uses a CommonJS-like syntax to define files, allowing treeshake to import only the files referenced into the build file. At runtime, the build file will initialize synchronously providing a public API to library.

###Getting started

This plugin requires Grunt ~0.4.0

If you haven't used Grunt before, be sure to check out the [Getting Started guide](http://gruntjs.com/getting-started), as it explains how to create a Gruntfile as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

	npm install grunt-treeshake --save-dev

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

	grunt.loadNpmTasks('grunt-treeshake');

###Grunt options

####wrap

**Type:** String

**Default:** undefined

Wrap all of the code in a closure, an easy way to make sure nothing is leaking. For variables that need to be public exports and global variables are made available. A namespace for the wrap shall provide access to the API.

**Example**

	treeshake: {
            test: {
                options: {
                    wrap: 'demo'
                },
                build: ['demo/*.js'], // reference to build files
                files: {
                    'demo/treeshaked_lib.js': ['src/**/*.js']
                }
            }
        }


###How to use

To have your JavaScript libraries support tree shaking, each function should be wrapped in a CommonJS-like structure. It is best practice to have one definition per file.

	define('myMethod', function() {
		return function() {
			console.log('myMethod called');		}
	});

The define function expects that you will return a value. The value can be anything. Typically it will return either a function or object but can represent anything even primitive values such as a Boolean, String, Number, or Array.

Definitions can be referenced by other definitions like so:

	define('anotherMethod', ['myMethod'], function(myMethod) { ... });

These dependencies will be included automatically by treeshake during the grunt process.

Once you grunt the definitions they will be available on a global namespace you define. For our examples, we are going to use the namespace "demo", but you can call it what ever you want in the configuration.

In your application you can reference the definitions in a couple different ways:

###Direct reference to definitions 		
Treeshake will find "demo.anotherMethod" *and* "demo.myMethod" and include them in the build.

	demo.anotherMethod();

Treeshake will also find these variations

	demo['anotherMethod']();  // single quote reference
	
	demo["anotherMethod"](); // double quote reference
	
	var anotherMethod = demo.anotherMethod; // alias reference
	anotherMethod();
	
	var d = demo;
	d.anotherMethod();
	
###Comment reference to definitions

There may be times when you want to include a definition but it is not referenced in one of supported formats. You can include a definition by referencing it in a comment tag like so. 

**Note:** *Use ! to inform treeshake to look in the comment*

	//! demo.myMethod
	
	/*!
	 * import demo.myMethod
	 * import demo.someOtherMethod
	 */

	 /**!
	  ** import demo.myMethod
	  ** import demo.someOtherMethod
	  **/

###Preventing method from showing on namespace

You may have some definitions that are "extensions" of another definition and do not need to be included on the namespace's API. To hide a definition, use **internal** in place of **define**.

	internal('myPrivateMethod', [deps...], function(){});
		
It can only be referenced by other **define** or **internal** functions.

	internal('myDef', ['myPrivateMethod'], function(myPrivateMethod) {...})
		
	define('myDef', ['myPrivateMethod'], function(myPrivateMethod) {...})	
###Using Treeshake with Hummingbird

Hummingbird is a micro framework that works similarly to AngularJS. In addition to the framework, hummingbird has several common utility libraries that can be via Treeshake. For more information go to [https://github.com/obogo/hummingbird]().

		