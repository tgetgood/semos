var fs = require('fs');
var mime = require('mime');

exports.serveFile = function(file, res) {
  var mimetype = mime.lookup(file);
  fs.stat(file, function(err, stats) {

    res.statusCode = 200;
    res.setHeader('Content-type', mimetype);
    res.setHeader('Content-length', stats.size);
    res.setHeader('Connection', 'keep-alive');

    // Node has a bad habit of closing connections serverside.
    res.connection.setTimeout(0);

    var filestream = fs.createReadStream(file);

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
  });
};

/*
 * In case we need extra meta-data with audio files.
 */
exports.serveAudio = function(file, res) {
  // res.setHeader('Connection', 'keep-alive');
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

