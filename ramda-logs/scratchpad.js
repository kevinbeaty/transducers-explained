'use strict'
var R = require('ramda')
var stream = require('transduce-stream')
var lines = require('transduce/string/lines')

// Is line a GET request for something other than static?
var isGet = R.test(/GET \//)
var notStatic = R.complement(R.test(/GET \/static/))
var isPage = R.allPass([isGet, notStatic])

var out
out =
R.filter(isPage, [
  '127.0.0.1 - - [26/Feb/2015 19:25:25] "GET /static/r.js HTTP/1.1"',
  '127.0.0.5 - - [26/Feb/2015 19:27:35] "GET /blog/ HTTP/1.1" 200 -',
  '127.0.0.1 - - [28/Feb/2015 16:44:03] "GET / HTTP/1.1" 200 -',
  '127.0.0.1 - - [28/Feb/2015 16:44:03] "POST / HTTP/1.1" 200 -'])
// => [ '127.0.0.5 - - [26/Feb/2015 19:27:35] "GET /blog/ HTTP/1.1" 200 -',
//      '127.0.0.1 - - [28/Feb/2015 16:44:03] "GET / HTTP/1.1" 200 -' ]
console.log(out)


// 'log line' -> ['IP', 'GET /url/path']
var splitLine = R.pipe(
      R.match(/^(\S+).+"([^"]+)"/),
      R.tail)
out =
R.map(splitLine, [
  '127.0.0.5 - - [26/Feb/2015 19:27:35] "GET /blog/ HTTP/1.1" 200 -',
  '127.0.0.1 - - [28/Feb/2015 16:44:03] "GET / HTTP/1.1" 200 -'])
// => [ [ '127.0.0.5', 'GET /blog/ HTTP/1.1' ],
//      [ '127.0.0.1', 'GET / HTTP/1.1' ] ]


// 'GET /url/path' -> 'http://simplectic.com/url/path'
var toURL = R.pipe(
      R.split(' '),
      R.slice(1, 2),
      R.prepend('http://simplectic.com'),
      R.join(''))
out =
R.map(toURL, [
  'GET /blog/ HTTP/1.1',
  'GET / HTTP/1.1'])
// => ['http://simplectic.com/blog/',
//     'http://simplectic.com/' ]


// Lens to operate on value in [key, value] pair
var valueLens = R.lens(
      // (entry) => entry[1]
      R.last,
      // (value, entry) => [entry[0], value]
      R.flip(R.useWith(Array, R.head)))

// ['IP', 'GET /url/path'] -> ['IP', 'http://simplectic.com/url/path']
var valueToUrl = valueLens.map(toURL)
out =
R.map(valueToUrl, [
  [ '127.0.0.5', 'GET /blog/ HTTP/1.1' ],
  [ '127.0.0.1', 'GET / HTTP/1.1' ] ])
// => [ [ '127.0.0.5', 'http://simplectic.com/blog/' ],
//      [ '127.0.0.1', 'http://simplectic.com/' ] ]

var joinVisited = R.pipe(
    R.join(' visited '),
    R.add(R.__, '\n'))
out =
R.map(joinVisited, [
 [ '127.0.0.5', 'http://simplectic.com/blog/' ],
 [ '127.0.0.1', 'http://simplectic.com/' ] ])
// => [ '127.0.0.5 visited http://simplectic.com/blog/\n',
//      '127.0.0.1 visited http://simplectic.com/\n' ]

out =
R.into('', R.identity, ['hello\n', 'world\n'])

var parseLog = R.compose(
      // step lines as it is streamed
      lines(),
      // filter non-static GET requests
      R.filter(isPage),
      // -> ['IP', 'GET /url/path']
      R.map(splitLine),
      // -> ['IP', 'http://simplectic.com/url/path']
      R.map(valueToUrl),
      // -> 'IP visited http://simplectic.com/url/path\n'
      R.map(R.join(' visited ')),
      R.map(R.add(R.__, '\n')))

console.log(out)
