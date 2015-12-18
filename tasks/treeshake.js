'use strict';
var removeComments = require('./utils/removeComments');
var printer = require('./utils/printer');
var emitter = require('./utils/emitter');
var toArray = require('./utils/toArray');

module.exports = function (grunt) {

    var gruntLogHeader = grunt.log.header;
    grunt.log.header = function () {
    };

    // :: INIT TASK DEPS :: //
    require('grunt-contrib-uglify/tasks/uglify')(grunt);

    // :: CONSTANTS :: //
    var NEWLINE = '\n';
    var TAB = '\t';
    var CONSOLE = 'console';
    var ALIASES = 'define|internal';

    var PRINT_VERBOSE = 'print::verbose';
    var PRINT_REPORT = 'print::report';
    var PRINT_FILE = 'print::file';
    var PRINT_LINE = 'print::line';
    var PRINT_IGNORED = 'print:ignored';
    var PRINT_FINALIZE = 'print::finalize';

    var TMP_FILE = '.tmpTreeshake/treeshake.js';

    var cache = {};
    var exportAs = {};
    var importPatterns = {};
    var unfound = [];
    var header, footer, cleanReservedWords;
    var everythingElse = /[^\*\.\w\d]/g;
    var readFile = grunt.file.read;

    header = readFile(__dirname + '/files/wrap_header.js') + readFile(__dirname + '/files/treeshake_header.js');
    footer = readFile(__dirname + '/files/treeshake_footer.js') + readFile(__dirname + '/files/wrap_footer.js');

    function getLookupRegExp(options) {
        return new RegExp('(' + ALIASES + ')([\\W\\s]+(("|\')[\\w|\\.]+\\3))+', 'gim')
    }

    function getPath(path) {
        if (!cache[path]) {
            cache[path] = readFile(path);
            addPatterns(path);
        }
        return cache[path];
    }

    function getFileNameFromContents(path, options) {
        var contents = getPath(path, options),
            rx = getLookupRegExp(options),
            matches = contents.match(rx), i, len = matches && matches.length || 0;
        for (i = 0; i < len; i += 1) {
            matches[i] = matches[i].split(',').shift();// only get the first match in a statement.
            matches[i] = matches[i].replace(cleanReservedWords, '');
            matches[i] = matches[i].replace(everythingElse, '');
        }
        //if (!matches) {
        //    grunt.log.writeln(NO_DEF_FOUND.yellow, path);
        //}
        return matches;
    }

    // we get any pattern matches from the file contents.
    // these will be used later on the inspect files to determine
    // if this file should be included.
    function addPatterns(path) {
        var p = [], content = cache[path];
        //var toggle = false;
        //if (path.indexOf('toggleClass') !== -1) {
        //    grunt.log.writeln(path.blue);
        //    toggle = true;
        //}
        content.replace(/(\/\/!|\*)\s+pattern\s+\/(\\\/|.*?)+\//gim, function (match, g1, g2) {
            var rx = match.replace(/.*?pattern\s+\//, '').replace(/\/$/, '');
            //if (toggle) {
            //    grunt.log.writeln(rx.green);
            //}
            p.push({match: match, rx: new RegExp(rx, 'gim')});
            return match;
        });
        if (p.length) {
            importPatterns[path] = p;
        }
    }

    /**
     * Build up all of the packages provided from the config.
     * @param {Object} files
     * @param {Object} options
     * @returns {{}}
     */
    function buildPackages(files, options) {
        emitter.fire(PRINT_VERBOSE, [NEWLINE + 'Definitions:']);
        var packages = {};
        var len, i, j, path, names, name, src;
        var defs = [];
        for (i in files) {
            src = files[i].src;
            len = src.length;
            for (j = 0; j < len; j += 1) {
                path = src[j];
                names = getFileNameFromContents(path, options);
                while (names && names.length) {
                    name = names.shift();
                    if (packages.hasOwnProperty(name) && packages[name] !== path) {
                        grunt.log.writeln(("overriding definition '" + name + NEWLINE + TAB + "'at: " + packages[name] + "\n\twith: " + path + "\n").yellow);
                    } else {
                        defs.push(name);
                    }
                    packages[name] = path;
                }
            }
        }
        defs.sort();
        for (i in defs) {
            emitter.fire(PRINT_VERBOSE, [TAB + (defs[i] + '').blue]);
        }
        return packages;
    }

    function buildExclusions(exclusions, packages, dependencies, options) {
        getPackageMatches('Gruntfile.js', packages, exclusions, options, 'exclude', dependencies, false);
        return dependencies;
    }

    function getPackageNameFromPath(packages, path) {
        for (var i in packages) {
            if (packages[i] === path) {
                return i;
            }
        }
    }

    function filterHash(dependencies, paths, packages, wrap, options, ignored) {
        paths = paths || [];
        var i, len = paths.length, expanded;
        dependencies = dependencies || {};
        for (i = 0; i < len; i += 1) {
            if (paths[i].indexOf('*') !== -1) {
                expanded = grunt.file.expand(paths[i]);
                filterHash(dependencies, expanded, packages, wrap, options, ignored);
            } else if (grunt.file.exists(paths[i])) {
                findDependencies(paths[i], packages, dependencies, wrap, options, ignored);
            }
        }
        return dependencies;
    }

    /**
     * Filter out any paths that do not exist in the packages
     * as long as there is no dependency reference.
     * @param {Array} paths
     * @param {Object} packages
     * @param {String} wrap
     * @param {Object} options
     * @param {Array} ignored
     * @returns []
     */
    function filter(paths, packages, wrap, options, ignored) {
        paths = paths || [];
        var result = [], i, dependencies = {}, written = {};
        // if they provide imports. We need to add them.
        if (options.import) {
            // populates those on dependencies.
            findKeys('Gruntfile.js', options.import, packages, dependencies, wrap, options, 'import', ignored);
        }
        filterHash(dependencies, paths, packages, wrap, options, ignored);
        emitter.fire(PRINT_REPORT, NEWLINE + 'Included:');
        for (i in dependencies) {
            if (dependencies.hasOwnProperty(i) && !written[dependencies[i].src]) {
                written[dependencies[i].src] = true;
                result.push(dependencies[i]);
            } else {
                // this is for duplicates that are skipped because they has multiple references in multiple files.
                //grunt.log.writeln("SKIP " + dependencies[i].src);
            }
        }

        result.sort();
        for (i in result) {
            emitter.fire(PRINT_FILE, result[i], {color: 'green'});
        }

        return result;
    }

    function getLineNumber(str, path) {
        var content = getPath(path),// we must get our own content so it still has comment lines in it.
            parts = content.replace(/(\n\r|\r\n|\r)/g, "\n").split("\n"), i, len = parts.length, index;
        for (i = 0; i < len; i += 1) {
            index = parts[i].indexOf(str);
            if (index !== -1) {
                return {num: i + 1};
            }
        }
        return '';
    }

    function createRegExp(alias) {
        return new RegExp('\\b' + alias + '(\\.\\w+|\\[("|\')\\w+\\2\\])+', 'gm');
    }

    function getAliasKeys(path, wrap) {
        var contents = getPath(path), aliases = [], rx, keys = [], i, len, matches = [];
        contents = removeComments(contents);
        contents.replace(new RegExp('(\\w+)\\s?=\\s?' + wrap + ';', 'g'), function (match, g1) {
            aliases.push(g1);
            return match;
        });

        function handleMatch(match, g1, g2) {
            var key, line;
            if (g1.length > 1) {
                line = getLineNumber(g1, path);
                key = {value: g1.substr(1, g1.length).replace(everythingElse, ''), line: line.num, from: path};
                keys.push(key);
            }
            return match;
        }

        if (aliases && (len = aliases.length)) {
            // we found aliases so we need to check for matches and add them to the keys.
            for (i = 0; i < len; i += 1) {
                rx = createRegExp(aliases[i]);
                contents.replace(rx, handleMatch);
            }
        }
        return keys;
    }

    // it needs to match all patterns in that file to be included.
    function matchesPatterns(pattern, path, options) {
        // path is passed for debugging. When you need to debug regex then use path.indexOf('filename.js') !== -1.
        // it will make your output much smaller.
        var i, len = pattern.length, found = false,
            contents = getPath(path, options),
            uncommented = removeComments(contents);
        for (i = 0; i < len; i += 1) {
            found = pattern[i].rx.test(uncommented);
            if (!found) {
                return false;
            }
        }
        return true;
    }

    function addImportPatternMatchesToKeys(keys, path, packages, options) {
        var i, pattern, name, key;
        for (i in importPatterns) {
            if (importPatterns.hasOwnProperty(i)) {
                if (matchesPatterns(importPatterns[i], path, options)) {
                    name = getPackageNameFromPath(packages, i.trim());
                    if (name) {
                        key = makeKey(name, path, i, options, 'pattern');
                        // use the first pattern match to get the line number.
                        key.line = getLineNumber(importPatterns[i][0].match, i);
                        keys.push(key);
                    } else {
                        grunt.log.writeln(("Missing package " + name + " (" + i + ")").red);
                    }
                }
            }
        }
    }

    function findDependencies(path, packages, dependencies, wrap, options, ignored) {
        var contents = '', i, len, rx, rx2, keys, len, split, keys;
        if (grunt.file.exists(path)) {
            contents = getPath(path, options);
            contents = removeComments(contents);
        } else {
            grunt.log.writeln("cannot find path", path.yellow);
        }

        rx = new RegExp('(' + wrap + '\\.|import\\s+)[\\w\\.\\*]+\\(?;?', 'gm');
        keys = contents.match(rx) || [];
        rx2 = new RegExp('(' + ALIASES + ')\\(("|\')(\\w\\.?)+\\2,\\s(\\[.*\\])?', 'gm');
        // do the split shift here to only search everything before the first {. So we don't match
        // quoted strings in the file.
        keys = keys.concat(contents.split('{').shift().match(rx2) || []);
        len = keys && keys.length || 0;
        keys = keys.concat(getAliasKeys(path, wrap) || []);
        keys = keys.concat(options.match(contents) || []);
        if (!options.ignorePatterns) {
            addImportPatternMatchesToKeys(keys, path, packages, options);
        }
        // now we need to clean up the keys.
        for (i = 0; i < len; i += 1) {
            // if it is already a key object leave it as is.
            // the strings we still need to convert to key objects.
            if (typeof keys[i] === 'string') {
                // if it has commas in the string, there are multiples, split them and try again.
                if (keys[i].indexOf(',') !== -1) {
                    split = keys[i].split(',');
                    keys = keys.concat(split);
                    len = keys.length;
                } else {
                    // we now have a single item string. So just make the key, and replace it.
                    keys[i] = makeKey(keys[i], path, null, options);
                }
            }
        }
        if (keys) {
            findKeys(path, keys, packages, dependencies, wrap, options, 'file', ignored);
            return dependencies;// dependencies
        }
    }

    function makeKey(value, from, src, options, forceType) {
        var line = from !== 'Gruntfile' ? getLineNumber(value, from) : null;
        var cleanWrap = new RegExp('[^\'"](?=' + options.wrap + ')\\w+\\.', 'gi');
        value = value.replace(cleanWrap, '');
        value = value.replace(cleanReservedWords, '');
        value = value.replace(everythingElse, '');
        return {
            value: value,
            src: src,
            line: line && line.num,
            from: from,
            type: forceType || (from === 'Gruntfile' ? 'file' : 'import')
        };
    }

    function getPackageMatches(fromPath, packages, importStatements, options, type, dependencies, findAdditionalDependencies) {
        var i, len = importStatements.length;
        for (i = 0; i < len; i += 1) {
            getPackageMatch(fromPath, packages, importStatements[i], options, type, dependencies, findAdditionalDependencies);
        }
    }

    function getPackageMatch(fromPath, packages, statementOrKey, options, type, dependencies, findAdditionalDependencies, ignored) {
        var i, names, name, match, key = statementOrKey;
        dependencies = dependencies || {};
        if (key) {
            if (!key.value) {
                key = {value: key + '', type: type};
            }
            match = packages[key.value];
            // ignored prevents it from looking up it or it's dependencies.
            if (ignored && ignored[key.value] && type !== 'import') {
                return null;
            }
            if (!match && !key.value.match(/^(define|\[)/)) {
                unfound.push(key);// unfound dependencies.
            }
            if (match && !dependencies[key.value]) {
                key = makeKey(key.value, fromPath, match, options, type);
                dependencies[key.value] = key;
                if (findAdditionalDependencies) {
                    findDependencies(match, packages, dependencies, options.wrap, options, ignored);
                }
            } else if (key.value && key.value.indexOf && key.value.indexOf('*') !== -1) {
                // these will be strings not objects for keys.
                var wild = key.value.substr(0, key.value.length - 1).split('.').join('/');
                for (i in packages) {
                    if (packages[i].indexOf(wild) !== -1) {
                        names = getFileNameFromContents(packages[i], options);
                        while (names && names.length) {
                            name = names.shift();
                            if (!ignored || !ignored[name] || key.type === 'import') {
                                dependencies[name] = makeKey(key.value, fromPath, packages[name], options, type);
                                if (findAdditionalDependencies) {
                                    findDependencies(packages[i], packages, dependencies, options.wrap, options, ignored);
                                }
                            }
                        }
                    }
                }
            }
        }
        return key;
    }

    function findKeys(path, keys, packages, dependencies, wrap, options, forceType, ignored) {
        var len = keys.length, i;// match, i, names, j, key, name;
        for (i = 0; i < len; i += 1) {
            getPackageMatch(path, packages, keys[i], options, forceType, dependencies, true, ignored);
        }
    }

    function printExclusions(files, packages, ignored) {
        emitter.fire(PRINT_LINE, NEWLINE + "Ignored:");
        emitter.fire(PRINT_IGNORED, ignored);
        var len = files.length, i, j, found, result = [];
        for (i in packages) {
            if (packages.hasOwnProperty(i)) {
                found = null;
                for (j = 0; j < len; j += 1) {
                    if ((ignored && ignored[i]) || files[j].src === packages[i]) {
                        found = files[j];
                        break;
                    }
                }
                if (!found) {
                    result.push(packages[i]);
                }
            }
        }

        result.sort();
        for (i in result) {
            emitter.fire(PRINT_LINE, TAB + result[i].yellow);
        }
    }

    function writeSources(wrap, files, dest, options) {
        // first we put our header on there for define and require.
        var str = header, i, len, key;
        len = options.includes.length, key;
        if (len) {
            emitter.fire(PRINT_LINE, NEWLINE + 'Forced Includes:');
            for (i = 0; i < len; i += 1) {
                key = makeKey('include.' + i, 'Gruntfile.js', options.includes[i], options, 'include');
                files.push(key);
                emitter.fire(PRINT_FILE, key, {color: 'yellow'});
            }
        }
        len = files.length;
        for (i = 0; i < len; i += 1) {
            str += '//! ' + files[i].src + NEWLINE;
            str += getPath(files[i].src);
        }
        // these exports will force external definition alias references.
        for (i in exportAs) {
            grunt.log.writeln(('export ' + i + ' as ' + exportAs[i]).green);
            str += "define('" + exportAs[i] + "', ['" + i + "'], function(fn) {" + NEWLINE +
                "    return fn;" + NEWLINE +
                "});" + NEWLINE;
        }
        str += footer;
        str = str.split('{$$namespace}').join(wrap);

        grunt.file.write(dest, str);
    }

    function writeFiles(dest, files, options, target) {
        if (options.wrap) {
            var buildFiles = {};
            buildFiles[dest] = files;

            var buildMinFiles = {};
            buildMinFiles[dest.substr(0, dest.length - 3) + '.min.js'] = dest;
            var uglify = grunt.config.get('uglify') || {};
            uglify[target] = {
                options: {
                    banner: options.banner ? options.banner + NEWLINE : '',
                    mangle: false,
                    compress: false,
                    preserveComments: 'some',
                    beautify: true,
                    exportAll: false,
                    sourceMap: false
                },
                files: buildFiles
            };

            if (options.minify) {
                var destRoot = dest.split('/');
                destRoot.pop();
                destRoot = destRoot.join('/');
                uglify[target + '_min'] = {
                    options: {
                        sourceMap: true,
                        sourceMapRoot: destRoot,
                        sourceMappingUrl: dest,
                        banner: options.banner ? options.banner + NEWLINE : '',
                    },
                    files: buildMinFiles
                };
            }

            grunt.config.set('uglify', uglify);
            grunt.task.run('uglify:' + target);
            if (options.minify) {
                grunt.task.run('uglify:' + target + '_min');
            }

            var filesize = {};
            filesize[target] = {
                path: dest,
                pathMin: dest.substr(0, dest.length - 3) + '.min.js',
                log: options.log,
                gruntLogHeader: options.gruntLogHeader
            };
            grunt.config.set('treeshake-filesize', filesize);
            grunt.task.run('treeshake-filesize:' + target);
        }
    }

    function outputUnfound() {
        if (unfound.length) {
            var missing = '', key, hash = {}, count = 0;
            for(var i = 0; i < unfound.length; i += 1) {
                key = unfound[i];
                // keys that don't have a line are because they were not a direct dependency match.
                // they could have come from the cusom options.match function which could match things
                // like 'word-word' and then it searches for dependency 'wordWord'. So ignore these.
                if (!hash[key.value] && key.line !== '') {
                    count += 1;
                    hash[key.value] = true;
                    missing += ('\n  "' + key.value + '" ' + (key.from &&  key.from + ':' + key.line|| key.type)).yellow;
                }
            }
            if (count) {
                grunt.log.writeln((count + ' match' + (count > 1 && 'es' || '') +' not found:' + missing).yellow);
                grunt.log.writeln('If you feel this match is in error you can ignore it by adding it to the "ignore" list'.grey);
            }
        }
    }

    grunt.registerMultiTask('treeshake', 'Optimize files added', function () {
        var target = this.target,
            packages,
            files,
            ignored;

        var options = this.options({
            wrap: this.target,
            log: CONSOLE,
            match: function () {
                return [];
            }
        });

        printer.setGrunt(grunt);
        printer.setOptions(options);


        options.import = toArray(options.import); // import files that match the patterns.
        options.ignore = toArray(options.ignore); // inspect files for excluded definitions
        options.exclude = toArray(options.exclude); // filter out just like import filters in. reverse-import.
        options.inspect = toArray(options.inspect); // which files to look through to determine if there are dependencies that need to be included.
        options.includes = toArray(options.includes); // for including any file. Such as libs or something that doesn't fit our pattern. A force import if you will. This is a force import because it is a list of paths that just get written in.
        cleanReservedWords = new RegExp('\\b(import|' + ALIASES + ')\\b', 'g');
        // we build the whole package structure. We will filter it out later.
        packages = buildPackages(this.files, options);
        ignored = filterHash({}, options.ignore, packages, options.wrap, options);
        buildExclusions(options.exclude, packages, ignored, options);
        files = filter(options.inspect, packages, options.wrap, options, ignored);
        if (options.report === 'verbose') {
            printExclusions(files, packages, ignored);
        }
        outputUnfound();
        // generate file.
        if (files.length) {
            writeSources(options.wrap, files, TMP_FILE, options);
            writeFiles(this.files[0].dest, [TMP_FILE], options, target);
        } else {
            grunt.file.write(TMP_FILE, '');
            grunt.log.error('No packages found. No files generated.'.red)
        }

    });

    grunt.registerMultiTask('treeshake-filesize', 'A Grunt plugin for logging file size.', function () {
        grunt.file.delete('.tmpTreeshake');
        grunt.log.header = gruntLogHeader;
        emitter.fire(PRINT_FINALIZE, this.data);
    });
};