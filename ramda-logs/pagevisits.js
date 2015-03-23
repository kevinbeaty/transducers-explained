'use strict'
var R = require('ramda')
var stream = require('transduce-stream')
var lines = require('transduce/string/lines')

// Is line a GET request for something other than static?
var isGet = R.test(/GET \//)
var notStatic = R.complement(R.test(/GET \/static/))
var isPage = R.allPass([isGet, notStatic])

// 'log line' -> ['IP', 'GET /url/path']
var splitLine = R.pipe(
      R.match(/^(\S+).+"([^"]+)"/),
      R.tail)

// 'GET /url/path' -> 'http://simplectic.com/url/path'
var toURL = R.pipe(
      R.split(' '),
      R.slice(1, 2),
      R.prepend('http://simplectic.com'),
      R.join(''))

// Lens to operate on value in [key, value] pair
var valueLens = R.lens(
      // (entry) => entry[1]
      R.last,
      // (value, entry) => [entry[0], value]
      R.flip(R.converge(Array, R.head, R.nthArg(1))))

// ['IP', 'GET /url/path'] -> ['IP', 'http://simplectic.com/url/path']
var valueToUrl = valueLens.map(toURL)

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
    
process.stdin.pipe(stream(parseLog)).pipe(process.stdout)
process.stdin.resume()
