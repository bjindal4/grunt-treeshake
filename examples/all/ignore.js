/**
 * This file represents another application that used Hummingbird to compile its files.
 * Because this file already contains the "each" definition, the grunt compiling against
 * this file will not include "each" in its own compile.
 */
// because this file already contains "each", "each" will not be compiled into build
define('each', function () {
});