'use strict';
module.exports = function (grunt) {

    var path = require('path');

    var headerWrap = '(function(exports, global) {\n\
    global["{$$namespace}"] = exports;\n';

    var footerWrap = '\n})(this["{$$namespace}"] || {}, function() {\n\
    return this;\n\
}());';

    var consoleStr = 'console',
        cache = {},
        printStr = '',
        printOptions = {report: false},
        print = function () {
            var args = Array.prototype.slice.call(arguments);
            if (printOptions.log === consoleStr) {
                grunt.log.writeln.apply(grunt.log, args);
            } else {
                while (args.length) {
                    printStr += grunt.log.uncolor(args.shift()) + " ";
                }
                printStr += "\n";
            }
        },
        printReport = function () {
            if (printOptions.report) {
                print.apply(this, arguments);
            }
        },
        printVerbose = function () {
            if (printOptions.report === 'verbose') {
                print.apply(this, arguments);
            }
        },
        printFileLine = function (fileKey, color) {
            fileKey.from = fileKey.from || 'Gruntfile.js';
            var str = fileKey.src[color];
            var str2 = ' - ' + fileKey.from;
            if (fileKey.type === 'file') {
                str2 += ':' + fileKey.line;
            } else {
                str2 += ':' + fileKey.type + ' ' + fileKey.value;
            }
            print.apply(this, ["\t" + str + str2.grey]);
        };


    var header, footer, cleanReservedWords, everythingElse;
    everythingElse = /[^\*\.\w\d]/g;

    require('grunt-contrib-uglify/tasks/uglify')(grunt);
    require('grunt-contrib-clean/tasks/clean')(grunt);

    if (grunt.file.exists('./tasks/wrapper/header.js')) {
        header = headerWrap + grunt.file.read('./tasks/wrapper/header.js');
        footer = grunt.file.read('./tasks/wrapper/footer.js') + footerWrap;
    } else {
        var root = path.resolve('node_modules');
        var findPath = root + '/**/grunt-treeshake/tasks/treeshake.js';
        var wrapperPath = grunt.file.expand(findPath).shift().split('treeshake.js').join('wrapper');
        header = headerWrap + grunt.file.read(wrapperPath + '/header.js');
        footer = grunt.file.read(wrapperPath + '/footer.js') + footerWrap;
    }


    /**
     * Remove comments from string to prevent accidental parsing
     * @param str
     * @returns {string}
     */
    function removeComments(str) {
        str = str.split('');
        var mode = {
            singleQuote: false,
            doubleQuote: false,
            regex: false,
            blockComment: false,
            lineComment: false,
            condComp: false,
            safeMode: false
        };
        for (var i = 0, l = str.length; i < l; i++) {

            if (mode.regex) {
                if (str[i] === '/' && str[i - 1] !== '\\') {
                    mode.regex = false;
                }
                continue;
            }

            if (mode.singleQuote) {
                if (str[i] === "'" && str[i - 1] !== '\\') {
                    mode.singleQuote = false;
                }
                continue;
            }

            if (mode.doubleQuote) {
                if (str[i] === '"' && str[i - 1] !== '\\') {
                    mode.doubleQuote = false;
                }
                continue;
            }

            if (mode.blockComment) {
                if (str[i] === '*' && str[i + 1] === '/') {
                    str[i + 1] = '';
                    mode.blockComment = false;
                }
                str[i] = '';
                continue;
            }

            if (mode.lineComment) {
                if (str[i + 1] === '\n' || str[i + 1] === '\r') {
                    mode.lineComment = false;
                }
                str[i] = '';
                continue;
            }

            if (mode.condComp) {
                if (str[i - 2] === '@' && str[i - 1] === '*' && str[i] === '/') {
                    mode.condComp = false;
                }
                continue;
            }

            mode.doubleQuote = str[i] === '"';
            mode.singleQuote = str[i] === "'";

            if (str[i] === '/') {

                if (str[i + 1] === '*' && str[i + 2] === '@') {
                    mode.condComp = true;
                    continue;
                }
                if (str[i + 1] === '*' && str[i + 2] !== '!' && str[i + 3] !== '!') {
                    str[i] = '';
                    mode.blockComment = true;
                    continue;
                }
                if (str[i + 1] === '/' && str[i + 2] !== '!') {
                    str[i] = '';
                    mode.lineComment = true;
                    continue;
                }
                mode.regex = true;

            }

        }
        return str.join('');
    }

    function getLookupRegExp(options) {
        return new RegExp('(' + options.aliases + ')([\\W\\s]+(("|\')[\\w|\\.]+\\3))+', 'gim')
    }

    function getPath(path, options) {
        if (!cache[path]) {
            cache[path] = grunt.file.read(path);
            if (options && options.export && options.export.length) {
                cache[path] = cache[path].replace(getLookupRegExp(options), function (match) {
                    //grunt.log.writeln('replacing', match);
                    var i, len = options.export.length, found = false;
                    for (i = 0; i < len; i += 1) {
                        if (match.match(new RegExp('("|\')' + options.export[i] + '(\\1|$)'))) {
                            found = true;
                        }
                    }
                    if (!found && match.indexOf('define') !== -1) {
                        match = match.replace(/define\(/, 'internal(');
                        //grunt.log.writeln("\t" + match);
                    }
                    return match;
                });
            }
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
        return matches;
    }

    /**
     * Build up all of the packages provided from the config.
     * @param {Object} files
     * @param {Object} options
     * @returns {{}}
     */
    function buildPackages(files, options) {
        printVerbose('\nDefinitions:'.grey);
        var packages = {}, len, i, j, path, names, name;
        var defs = [];
        for (i in files) {
            len = files[i].src.length;
            for (j = 0; j < len; j += 1) {
                path = files[i].src[j];
                names = getFileNameFromContents(path, options);
                while (names && names.length) {
                    name = names.shift();
                    packages[name] = path;
                    defs.push(name);
                }
            }
        }
        defs.sort();
        for (i in defs) {
            printVerbose("\t" + (defs[i] + '').grey);
        }
        return packages;
    }

    function buildExclusions(exclusions, packages, dependencies, options) {
        getPackageMatches('Gruntfile.js', packages, exclusions, options, 'exclude', dependencies, false);
        return dependencies;
    }

    function filterHash(dependencies, paths, packages, wrap, options, ignored) {
        paths = paths || [];
        var i, len = paths.length, expanded;
        dependencies = dependencies || {};
        for (i = 0; i < len; i += 1) {
            //print.apply(options, [paths[i]]);
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
            findKeys('Gruntfile.js', options.import, packages, dependencies, wrap, options, 'import');
        }
        filterHash(dependencies, paths, packages, wrap, options, ignored);
        printReport("\nIncluded:");
        for (i in dependencies) {
            if (dependencies.hasOwnProperty(i) && !written[dependencies[i].src]) {
                written[dependencies[i].src] = true;
                //if (ignored && ignored.hasOwnProperty(i)) {
                //    ignored[i].ignoreCount = (ignored[i].ignoreCount || 0) + 1;
                //} else {
                    result.push(dependencies[i]);
                //}
                //printReport("\t" + dependencies[i].green);
            } else {
                // this is for duplicates that are skipped because they has multiple references in multiple files.
                //grunt.log.writeln("SKIP " + dependencies[i].src);
            }
        }

        result.sort();
        for (i in result) {
            printFileLine(result[i], 'green');
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

    function getRx(alias) {
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
                rx = getRx(aliases[i]);
                contents.replace(rx, handleMatch);
            }
        }
        return keys;
    }

    function findDependencies(path, packages, dependencies, wrap, options, ignored) {
        //grunt.log.writeln('##PATH##', path);
        var contents = '', i, len, rx, keys, len, split, keys;

        if (grunt.file.exists(path)) {
            contents = getPath(path, options);
            contents = removeComments(contents);
        }

        //print(contents);
        rx = new RegExp('((' + wrap + '\\.|import\\s+)[\\w\\.\\*]+\\(?;?|(' + options.aliases + ')([\\W\\s]+(("|\')[\\w|\\.]+))+)', 'gim');
        keys = contents.match(rx) || [];
        len = keys && keys.length || 0;
        //cleanWrap = new RegExp('\\b' + wrap + '\\.', 'gi');
        keys = keys.concat(getAliasKeys(path, wrap) || []);
        keys = keys.concat(options.match(contents) || []);
        // now we need to clean up the keys.
        //grunt.log.writeln("keys", keys);
        for (i = 0; i < len; i += 1) {
            if (keys[i].indexOf(',') !== -1) {
                split = keys[i].split(',');
                keys = keys.concat(split);
                len = keys.length;
            } else {
                keys[i] = makeKey(keys[i], path, null, options);
            }
        }
        //print("keys", keys);
        if (keys) {
            findKeys(path, keys, packages, dependencies, wrap, options, 'file', ignored);
            //print(JSON.stringify(dependencies, null, 2));
            return dependencies;// dependencies
        }
    }

    function makeKey(value, from, src, options, forceType) {
        var line = from !== 'Gruntfile' ? getLineNumber(value, from) : null;
        var cleanWrap = new RegExp('\\b' + options.wrap + '\\.', 'gi');
        value = value.replace(cleanWrap, '');
        value = value.replace(cleanReservedWords, '');
        value = value.replace(everythingElse, '');
        //grunt.log.writeln(value, from);
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
                key = {value: key + ''};
            }
            match = packages[key.value];
            // ignored prevents it from looking up it or it's dependencies.
            if (match && !dependencies[key.value] && (!ignored || !ignored[key.value])) {
                key = makeKey(key.value, fromPath, match, options, type);
                dependencies[key.value] = key;
                //print("find dependencies in", match);
                if (findAdditionalDependencies) {
                    findDependencies(match, packages, dependencies, options.wrap, options, 'file', ignored);// do not pass force type to recursion. recursion should be of type file.
                }
            } else if (key.value && key.value.indexOf && key.value.indexOf('*') !== -1) {
                // these will be strings not objects for keys.
                var wild = key.value.substr(0, key.value.length - 1).split('.').join('/');
                //print("wildcard", key.value.red, wild);
                for (i in packages) {
                    if (packages[i].indexOf(wild) !== -1) {
                        //print("\t*", wild.yellow, packages[j].green);
                        names = getFileNameFromContents(packages[i], options);
                        while (names && names.length) {
                            name = names.shift();
                            if (!ignored || !ignored[name]) {
                                dependencies[name] = makeKey(key.value, fromPath, packages[name], options, type);
                                if (findAdditionalDependencies) {
                                    findDependencies(packages[i], packages, dependencies, options.wrap, options, 'file', ignored);// do not pass force type to recursion. recursion should be of type file.
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
            keys[i] = getPackageMatch(path, packages, keys[i], options, forceType, dependencies, true, ignored);
        }
    }

    function printIgnores(ignored) {
        var i;
        if (ignored) {
            for (i in ignored) {
                if (ignored[i].ignoreCount) {
                    printFileLine(ignored[i], 'grey');
                }
            }
        }
    }

    function printExclusions(files, packages, ignored) {
        print("\nIgnored:".grey);
        printIgnores(ignored);
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
            print("\t" + result[i].grey);
        }
    }

    function writeSources(wrap, files, dest, options) {
        // first we put our header on there for define and require.
        var str = header, i, len;
        //TODO: we couldn't think of a reason to keep this to force an include.
        //len = options.includes.length, key;
        //if (len) {
        //    print("\nForced Includes:");
        //    for (i = 0; i < len; i += 1) {
        //        key = makeKey('include.' + i, 'Gruntfile.js', options.includes[i], options, 'include');
        //        files.push(key);
        //        printFileLine(key, 'yellow');
        //    }
        //}
        len = files.length;
        for (i = 0; i < len; i += 1) {
            str += '//! ' + files[i].src + "\n";
            str += getPath(files[i].src);
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
                    mangle: false,
                    compress: false,
                    preserveComments: 'some',
                    beautify: true,
                    exportAll: false
                },
                files: buildFiles
            };

            if (options.minify) {
                uglify[target + '_min'] = {
                    options: {
                        wrap: options.wrap
                    },
                    files: buildMinFiles
                };
            }

            var clean = grunt.config.get('clean') || {};
            clean[target] = '.tmpTreeshake';

            grunt.config.set('uglify', uglify);
            grunt.task.run('uglify:' + target);
            if (options.minify) {
                grunt.task.run('uglify:' + target + '_min');
            }

            grunt.config.set('clean', clean);
            grunt.task.run('clean:' + target);

            var filesize = {};
            filesize[target] = {
                path: dest,
                pathMin: dest.substr(0, dest.length - 3) + '.min.js',
                log: options.log
            };
            grunt.config.set('treeshake-filesize', filesize);
            grunt.task.run('treeshake-filesize:' + target);
        }
    }

    function toArray(item) {
        if (item && typeof item === "string") {
            return [item];
        }
        return item || [];
    }

    grunt.registerMultiTask('treeshake', 'Optimize files added', function () {
        var target = this.target,
            packages,
            files,
            ignored;

        var options = this.options({
            wrap: this.target,
            log: consoleStr,
            match: function () {
                return [];
            }
        });
        printOptions.report = options.report;
        printOptions.log = options.log;
        options.import = toArray(options.import);
        options.ignore = toArray(options.ignore);// inspect files for excluded definitions
        options.exclude = toArray(options.exclude);// filter out just like import filters in. reverse-import.
        options.inspect = toArray(options.inspect);
        options.export = toArray(options.export);
        options.aliases = 'internal|define';
        //TODO: we couldn't think of a reason to keep this to force an include.
        //options.includes = toArray(options.includes);

        cleanReservedWords = new RegExp('\\b(import|' + options.aliases + ')\\b', 'g');
        // we build the whole package structure. We will filter it out later.
        packages = buildPackages(this.files, options);
        ignored = filterHash({}, options.ignore, packages, options.wrap, options);
        buildExclusions(options.exclude, packages, ignored, options);
        files = filter(options.inspect, packages, options.wrap, options, ignored);
        if (options.report === 'verbose') {
            printExclusions(files, packages, ignored);
        }
        // generate file.
        //print.apply(options, [files]);
        writeSources(options.wrap, files, '.tmpTreeshake/treeshake.js', options);
        writeFiles(this.files[0].dest, ['.tmpTreeshake/treeshake.js'], options, target);
    });

    var fs = require('fs');

    grunt.registerMultiTask('treeshake-filesize', 'A Grunt plugin for logging filesize.', function () {
        var data = this.data;
        cache = {};

        function getSize(path) {
            if (grunt.file.exists(path)) {
                var stat = fs.statSync(path);
                return (stat.size / 1024).toFixed(2);
            }
        }

        if (printOptions.log === consoleStr) {
            print("\nOutput:");
            print("\t" + data.path.blue, (getSize(data.path) + 'k').green);
            if (data.pathMin) {
                print("\t" + data.pathMin.blue, (getSize(data.pathMin) + 'k').green);
            }
        } else {
            var output = "Output:\n" +
                "\t" + data.path + " " + getSize(data.path) + 'k' + "\n";
            if (data.pathMin) {
                output += "\t" + data.pathMin + " " + getSize(data.pathMin) + 'k' + "\n";
            }

            printStr = '------' + new Date().toLocaleString() + "------\n\n" + output + printStr;

            grunt.file.write(printOptions.log, printStr);
        }
    });
};