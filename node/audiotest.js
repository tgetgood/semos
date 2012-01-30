var fs = require('fs');
var http = require('http');
var path = require('path');
var mime = require('mime');
var url = require('url');


var uploadFile = function(file, res) {
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
}

var serveAudio = function(req, res) {

  var file = './test.mp3';
  var filename = path.basename(file);

  res.setHeader('Content-disposition', 'attachment; filename=' + filename);

  uploadFile(file, res)
}

var serveJplayer = function(req, res) {
  var file = "./jQuery.jPlayer.2.1.0/jquery.jplayer.min.js"; 

  uploadFile(file, res);
}

var musicServer = http.createServer(function (req, res) {
  // console.log(req);

  var path = url.parse(req.url).path;
  switch (path) {
    case '/jplayer':
      serveJplayer(req, res);
      break;
    case '/test':
      serveAudio(req, res);
      break;
    default:
      serve404(req, res);
      break;
  }
});

var httpServer = http.createServer(function (req, res) {

  uploadFile('./index.html', res);
});

musicServer.listen(9000);
httpServer.listen(8000);

