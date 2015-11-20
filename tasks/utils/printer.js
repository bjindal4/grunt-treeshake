var fs = require('fs');
var emitter = require('./emitter');
var toArray = require('./toArray');
var CONSOLE = 'console';
var NEWLINE = '\n';
var TAB = '\t';
var printStr = '';

var grunt, options = {report: false};

var PRINT_VERBOSE = 'print::verbose';
var PRINT_REPORT = 'print::report';
var PRINT_FILE = 'print::file';
var PRINT_LINE = 'print::line';
var PRINT_IGNORED = 'print:ignored';
var PRINT_FINALIZE = 'print::finalize';

var log = function () {
    var args = Array.prototype.slice.call(arguments);
    if (options.log === CONSOLE) {
        grunt.log.writeln.apply(grunt.log, args);
    } else {
        for (var i = 0; i < args.length; i++) {
            printStr += grunt.log.uncolor(args[i]) + " ";
        }
        printStr += NEWLINE;
    }
};

emitter.on(PRINT_REPORT, function (evt, strings) {
    if (options.report) {
        log.apply(null, toArray(strings));
    }
});

emitter.on(PRINT_VERBOSE, function (evt, strings) {
    if (options.report === 'verbose') {
        log.apply(null, toArray(strings));
    }
});


emitter.on(PRINT_FILE, function (evt, fileInfo, options) {
    fileInfo.from = fileInfo.from || 'Gruntfile.js';
    var str = fileInfo.src[options.color];
    var str2 = ' - ' + fileInfo.from;
    if (fileInfo.type === 'file') {
        str2 += ':' + fileInfo.line;
    } else {
        str2 += ':' + fileInfo.type + ' ' + fileInfo.value;
    }
    log.apply(null, toArray(TAB + str + str2.grey));
});

emitter.on(PRINT_LINE, function (evt, strings) {
    log.apply(null, toArray(strings));
});

emitter.on(PRINT_IGNORED, function (evt, ignored) {
    var i;
    if (ignored) {
        for (i in ignored) {
            if (ignored[i].ignoreCount) {
                emitter.fire(PRINT_FILE, ignored[i], {color: 'grey'});
            }
        }
    }
});

emitter.on(PRINT_FINALIZE, function (evt, data) {
    function getSize(path) {
        if (grunt.file.exists(path)) {
            var stat = fs.statSync(path);
            return (stat.size / 1024).toFixed(2);
        }
    }

    if (options.log === CONSOLE) {
        emitter.fire(PRINT_LINE, NEWLINE + "Files generated:");
        emitter.fire(PRINT_LINE, TAB + data.path.blue, (getSize(data.path) + 'k').green);
        if (options.minify && data.pathMin) {
            emitter.fire(PRINT_LINE, TAB + data.pathMin.blue, (getSize(data.pathMin) + 'k').green);
        }
    } else {
        var output = "Files generated:" + NEWLINE + TAB + data.path + " " + getSize(data.path) + 'k' + NEWLINE;
        if (options.minify && data.pathMin) {
            output += TAB + data.pathMin + " " + getSize(data.pathMin) + 'k' + NEWLINE;
        }

        printStr = '------' + new Date().toLocaleString() + "------" + NEWLINE + NEWLINE + output + printStr;

        grunt.file.write(options.log, printStr);
    }
});

exports.setGrunt = function(val) {
    grunt = val;
};

exports.setOptions = function(val) {
    options = val;
};
