var http = require('http');
var url = require('url');
var querystring = require('querystring');
var helpers = require('../lib/server-helpers.js');

var musicDir = '/home/thomas/storage/music';

var server = http.createServer(function(req, res) {

  var path = url.parse(req.url).path;
  path = querystring.unescape(path);

  console.log(path)
  if (path.match(/\.\//) || path.indexOf(musicDir) !== 0) {
    helpers.forbid(req, res);
  }
  else {
    helpers.serveFile(path, res);
  }
}).listen(31337);
