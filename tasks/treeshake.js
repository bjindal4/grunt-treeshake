'use strict';
module.exports = function (grunt) {

    var headerWrap = '(function(exports, global) {\n\
    global["{$$namespace}"] = exports;\n';

    var footerWrap = '\n})(this["{$$namespace}"] || {}, function() {\n\
    return this;\n\
}());';

    var consoleStr = 'console',
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
            var str = fileKey.src[color] + (' - ' + fileKey.from + ':' + (fileKey.line !== undefined ? fileKey.line : fileKey.type + ' ' + fileKey.value)).grey;
            print.apply(this, ["\t" + str]);
        };

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-clean');

    var header, footer, cleanReservedWords, everythingElse;
    cleanReservedWords = new RegExp('\\b(import|internal|define)\\b', 'g');
    everythingElse = /[^\*\.\w\d]/g;

    if (grunt.file.exists('./node_modules/grunt-treeshake/tasks/lib/header.js')) {
        header = headerWrap + grunt.file.read('./node_modules/grunt-treeshake/tasks/lib/header.js');
        footer = grunt.file.read('./node_modules/grunt-treeshake/tasks/lib/footer.js') + footerWrap;
    } else {
        header = headerWrap + grunt.file.read('./tasks/lib/header.js');
        footer = grunt.file.read('./tasks/lib/footer.js') + footerWrap;
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

    function getFileNameFromContents(path) {
        var contents = grunt.file.read(path),
            rx = new RegExp('(internal|define)([\\W\\s]+(("|\')[\\w|\\.]+\\3))+', 'gim'),
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
     * @returns {{}}
     */
    function buildPackages(files) {
        printVerbose('\nDefinitions:'.grey);
        var packages = {}, len, j, path, names, name;
        for (var i in files) {
            len = files[i].src.length;
            for (j = 0; j < len; j += 1) {
                path = files[i].src[j];
                names = getFileNameFromContents(path);
                while (names && names.length) {
                    name = names.shift();
                    packages[name] = path;
                    printVerbose("\t" + (name + '').grey);
                }
            }
        }
        return packages;
    }

    function filterHash(dependencies, paths, packages, wrap, options) {
        paths = paths || [];
        var i, len = paths.length;
        dependencies = dependencies || {};
        paths = grunt.file.expand(paths);
        for (i = 0; i < len; i += 1) {
            //print.apply(options, [paths[i]]);
            findDependencies(paths[i], packages, dependencies, wrap, options);
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
        var result = [], i, dependencies = {};
        // if they provide imports. We need to add them.
        if (options.import) {
            // populates those on dependencies.
            findKeys(options.import, packages, dependencies, wrap, options);
        }
        filterHash(dependencies, paths, packages, wrap, options);
        printReport("\nIncluded:");
        for (i in dependencies) {
            if (dependencies.hasOwnProperty(i)) {
                if (ignored && ignored.hasOwnProperty(i)) {
                    ignored[i].ignoreCount = (ignored[i].ignoreCount || 0) + 1;
                } else {
                    result.push(dependencies[i]);
                    printFileLine(dependencies[i], 'green');
                }
                //printReport("\t" + dependencies[i].green);
            }
        }
        return result;
    }

    function getLineNumber(str, path) {
        var content = grunt.file.read(path),// we must get our own content so it still has comment lines in it.
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
        var contents = grunt.file.read(path), aliases = [], rx, keys = [], i, len, matches = [];
        contents = removeComments(contents);
        contents.replace(new RegExp('(\\w+)\\s?=\\s?' + wrap + ';', 'g'), function (match, g1) {
            aliases.push(g1);
            return match;
        });

        function handleMatch(match, g1, g2) {
            var key, line;
            if (g1.length > 1) {
                line = getLineNumber(g1, path);
                key = {value: g1.substr(1, g1.length).replace(everythingElse, ''), line: line.num, from:path};
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

    function findDependencies(path, packages, dependencies, wrap, options) {
        var contents, i, len, rx, keys, len, cleanWrap, split, line;

        contents = grunt.file.read(path);
        contents = removeComments(contents);
        //print(contents);
        rx = new RegExp('((' + wrap + '\\.|import\\s+)[\\w\\.\\*]+\\(?;?|(internal|define)([\\W\\s]+(("|\')[\\w|\\.]+))+)', 'gim');
        keys = contents.match(rx);
        len = keys && keys.length || 0;
        cleanWrap = new RegExp('\\b' + wrap + '\\.', 'gi');
        keys = keys.concat(getAliasKeys(path, wrap));
        // now we need to clean up the keys.
        //grunt.log.writeln("keys", keys);
        for (i = 0; i < len; i += 1) {
            if (keys[i].indexOf(',') !== -1) {
                split = keys[i].split(',');
                keys = keys.concat(split);
                len = keys.length;
            } else {
                line = getLineNumber(keys[i], path);
                keys[i] = keys[i].replace(cleanWrap, '');
                keys[i] = keys[i].replace(cleanReservedWords, '');
                keys[i] = keys[i].replace(everythingElse, '');
                keys[i] = {value: keys[i], line: line.num, char: line.char, from: path};
            }
        }
        //print("keys", keys);
        if (keys) {
            findKeys(keys, packages, dependencies, wrap, options);
            //print(JSON.stringify(dependencies, null, 2));
            return dependencies;// dependencies
        }
    }

    function findKeys(keys, packages, dependencies, wrap, options) {
        var len = keys.length, match, i, names, j, key, name;
        for (i = 0; i < len; i += 1) {
            key = keys[i];
            if (key) {
                if (!key.value) {
                    key = keys[i] = {value: key + ''};
                }
                match = packages[key.value];
                if (match && !dependencies[key.value]) {
                    key.src = match;
                    dependencies[key.value] = key;
                    //print("find dependencies in", match);
                    findDependencies(match, packages, dependencies, wrap, options);
                } else if (key.value && key.value.indexOf && key.value.indexOf('*') !== -1) {
                    // these will be strings not objects for keys.
                    var wild = key.value.substr(0, key.value.length - 1).split('.').join('/');
                    //print("wildcard", key.value.red, wild);
                    for (j in packages) {
                        if (packages[j].indexOf(wild) !== -1) {
                            //print("\t*", wild.yellow, packages[j].green);
                            names = getFileNameFromContents(packages[j]);
                            while (names && names.length) {
                                name = names.shift();
                                dependencies[name] = {
                                    src: packages[name],
                                    from: 'Gruntfile.js',
                                    type: 'import',
                                    value: key.value
                                };
                                findDependencies(packages[j], packages, dependencies, wrap, options);
                            }
                        }
                    }
                }
            }
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
        var len = files.length, i, j, found;
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
                    print("\t" + packages[i].grey);
                }
            }
        }
    }

    function writeSources(wrap, files, dest) {
        // first we put our header on there for define and require.
        var str = header, i, len = files.length;
        for (i = 0; i < len; i += 1) {
            str += '//! ' + files[i].src + "\n";
            str += grunt.file.read(files[i].src);
        }
        str += footer;
        str = str.split('{$$namespace}').join(wrap);

        grunt.file.write(dest, str);
    }

    function writeFiles(dest, files, options, target) {
        print("\nOutput:\n\t" + dest.blue);
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
            clean[target] = '.tmp';

            grunt.config.set('uglify', uglify);
            grunt.task.run('uglify:' + target);
            if (options.minify) {
                grunt.task.run('uglify:' + target + '_min');
            }

            grunt.config.set('clean', clean);
            grunt.task.run('clean:' + target);
        }
    }

    function toArray(item) {
        if (item && typeof item === "string") {
            return [item];
        }
        return item;
    }

    grunt.registerMultiTask('treeshake', 'Optimize files added', function () {
        var target = this.target,
            packages,
            files,
            ignored;

        var options = this.options({
            wrap: this.target,
            log: consoleStr
        });
        printOptions.report = options.report;
        printOptions.log = options.log;
        options.import = toArray(options.import);
        options.ignore = toArray(options.ignore);
        options.inspect = toArray(options.inspect);

        // we build the whole package structure. We will filter it out later.
        packages = buildPackages(this.files);
        ignored = filterHash({}, options.ignore, packages, options.wrap, options);
        files = filter(options.inspect, packages, options.wrap, options, ignored);
        if (options.report === 'verbose') {
            printExclusions(files, packages, ignored);
        }
        // generate file.
        //print.apply(options, [files]);
        writeSources(options.wrap, files, '.tmp/treeshake.js');
        writeFiles(this.files[0].dest, ['.tmp/treeshake.js'], options, target);
        if (printOptions.log !== consoleStr) {
            var content = '';
            printStr = '------' + new Date().toLocaleString() + "------\n" + printStr + "\n" + content;
            grunt.file.write(printOptions.log, printStr);
        }
    });
};