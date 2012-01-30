var fs = require('fs');
var http = require('http');
var path = require('path');
var mime = require('mime');
var url = require('url');

// TODO: Is this really the best way to make this secure? 
// It is fairly secure, but not very maintainable.
// Provide access to files in the following dirs only.
var validPaths = /^\/index\.html|^\/ajax-solr\/|^\/jPlayer\/|^\/js\/|^\/$/;
validPaths.compile(validPaths);

var serveFile = function(file, res) {
  var mimetype = mime.lookup(file);
  var filestream = fs.createReadStream(file);

  res.statusCode = 200;
  res.setHeader('Content-type', mimetype);

  filestream.on('data', function (chunk) {
    res.write(chunk);
  });
  filestream.on('end', function () {
    res.end();
  });
  filestream.on('error', function (err) {
    // TODO: Don't assume this is a file not found...
    serve404({}, res);
  });
}

var serveAudio = function(req, res) {

  var file = './test.mp3';
  var filename = path.basename(file);

  res.setHeader('Content-disposition', 'attachment; filename=' + filename);

  uploadFile(file, res)
}

var serve404 = function(req, res) {
  res.statusCode = 404;
  res.write("You did it wrong.");
  res.end()
}

var forbid = function(req, res) {
  res.statusCode = 403;
  res.write("Tsk tsk.");
  res.end();
}

var server = http.createServer(function (req, res) {

  var path = url.parse(req.url).path;
  
  // Make sure nothing evil is going on and serve the file.
  if (path.match(/\.\//) || !validPaths.test(path)) {
    serve404(req, res);
  }
  else {
    if (path === '/') {
      serveFile('./index.html', res);
    }
    else {
      serveFile('.' + path, res);
    }
  }
});

server.listen(8000);

