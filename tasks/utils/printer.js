var fs = require('fs');
var emitter = require('./emitter');
var toArray = require('./toArray');
var CONSOLE = 'console';
var NEWLINE = '\n';
var TAB = '\t';
var printStr = '';

var grunt, options = {report: false};

var log = function () {
    var args = Array.prototype.slice.call(arguments);
    if (options.log === CONSOLE) {
        grunt.log.writeln.apply(grunt.log, args);
    } else {
        for (var i = 0; i < args.length; i++) {
            printStr += grunt.log.uncolor(args[i]) + " ";
            //printStr += args[i].toString();
        }
        printStr += NEWLINE;
    }
};

emitter.on('print::report', function (evt, strings) {
    if (options.report) {
        log.apply(null, toArray(strings));
    }
});

emitter.on('print::verbose', function (evt, strings) {
    if (options.report === 'verbose') {
        log.apply(null, toArray(strings));
    }
});


emitter.on('print::file', function (evt, fileInfo, options) {
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

emitter.on('print::line', function (evt, strings) {
    log.apply(null, toArray(strings));
});

emitter.on('print:ignored', function (evt, ignored) {
    var i;
    if (ignored) {
        for (i in ignored) {
            if (ignored[i].ignoreCount) {
                emitter.fire('print::file', ignored[i], {color: 'grey'});
            }
        }
    }
});

emitter.on('print::finalize', function (evt, data) {
    cache = {};

    function getSize(path) {
        if (grunt.file.exists(path)) {
            var stat = fs.statSync(path);
            return (stat.size / 1024).toFixed(2);
        }
    }

    if (options.log === CONSOLE) {
        emitter.fire('print::line', NEWLINE + "Output:");
        emitter.fire('print::line', TAB + data.path.blue, (getSize(data.path) + 'k').green);
        if (data.pathMin) {
            emitter.fire('print::line', TAB + data.pathMin.blue, (getSize(data.pathMin) + 'k').green);
        }
    } else {
        var output = "Output:" + NEWLINE + TAB + data.path + " " + getSize(data.path) + 'k' + NEWLINE;
        if (data.pathMin) {
            output += TAB + data.pathMin + " " + getSize(data.pathMin) + 'k' + NEWLINE;
        }

        //emitter.fire('print::')
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
