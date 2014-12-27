grunt-treeshake
=========

A grunt task used to import and compile JavaScript files referenced by your project.

The grunt-treeshake task uses a CommonJS-like syntax to define files, allowing treeshake to import only the files referenced into the build file. At runtime, the build file will initialize synchronously profiding a publi