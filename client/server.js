// Simple static file server. I'm sure I could find one, but it took five
// minutes to write.
//
// Intended to serve the the webpage so that I can access it from machines
// where I don't want to download stuff like this.

var http = require('http');
var url = require('url');
var helpers = require('../lib/server-helpers.js');

// TODO: Is this really the best way to make this secure?
// It is fairly secure, but not very maintainable.
// Provide access to files in the following dirs only.
var validPaths = /^\/index\.html$|^\/clientConfig\.js$|^\/ajax-solr\/|^\/jPlayer\/|^\/js\/|^\/$/;
validPaths.compile(validPaths);

var server = http.createServer(function (req, res) {

  var path = url.parse(req.url).path;

  // Make sure nothing evil is going on and serve the file.
  if (path.match(/\.\//) || !validPaths.test(path)) {
    helpers.serve404(req, res);
  }
  else {
    if (path === '/') {
      helpers.serveFile('./index.html', res);
    }
    else {
      helpers.serveFile('.' + path, res);
    }
  }
});

server.listen(8000);

