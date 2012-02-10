var http = require('http');
var url = require('url');
var querystring = require('querystring');
var helpers = require('../../lib/server-helpers.js');
var cron = require('cron');
var spawn = require('child_process').spawn;


var localIP = '127.0.0.1';
var localPort = 31337;
var solrHost = 'localhost';
var solrPort = 8080;
var musicDir = '';
var fileTypes = [];

// TODO: Add processing here for reading in config.

var checkIP = function () {
  http.request({host: 'whatismyip.org'}, function(res) {
    res.on('data', function(chunk) {
      localIP = chunk.toString();
    });
  }).on('error', function(e) {
    console.log(e);
  }).end();
};


// TODO: Should probably redo this in node (if feasible) to reduce dependencies.
var reindex = function() {
  var pyArgs = [
            'scripts/build_index.py', 
            localIP,
            localPort,
            solrHost,
            solrPort,
            musicDir
  ];
  pyArgs += fileTypes;


  var script = spawn('python', pyArgs, {});

  script.on('exit', function(code) {
    if (code === 0) {
      console.log("Index update successful.");
    }
    else {
      console.log("Index update exited with error code " + code);
    }
  });
};

// TODO: Only necessary for dynamic IPs, and not every 15 minutes.
// If this isn't changed it was forgotten.
cron.cronJob('* */15 * * * *', checkIP);

cron.cronJob('* */15 * * * *', reindex);


var server = http.createServer(function(req, res) {

  var path = url.parse(req.url).path;
  path = querystring.unescape(path);

  if (path.match(/\.\//) || path.indexOf(musicDir) !== 0) {
    helpers.forbid(req, res);
  }
  else {
    // TODO: This log may get really big on extended use...
    console.log(path);
    helpers.serveAudio(path, res);
  }
}).listen(localPort);  
