/*!
    import demo.object.*
 */

// Note: validators/isNumber will not be included because there is no reference either directly or through import

var stuff = demo;
var jsonp = demo.http.jsonp;
var result = jsonp();
console.log('result', result);
//console.log(stuff.isNumber);
stuff['isNumber'];