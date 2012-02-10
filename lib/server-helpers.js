var fs = require('fs');
var mime = require('mime');

exports.serveFile = function(file, res) {
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
    // TODO: Don't assume exports is a file not found...
    exports.serve404({}, res);
  });
};

exports.serveAudio = function(file, res) {
  res.setHeader('Content-disposition', 'attachment; filename=' + file);
  exports.serveFile(file, res)
};

exports.serve404 = function(req, res) {
  res.statusCode = 404;
  res.write("You did it wrong.");
  res.end()
};

exports.forbid = function(req, res) {
  res.statusCode = 403;
  res.write("Tsk tsk.");
  res.end();
};

