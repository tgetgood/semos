var http = require('http');
var url = require('url');
var querystring = require('querystring');
var helpers = require('../../lib/server-helpers.js');
var cron = require('cron');
var spawn = require('child_process').spawn;
var fs = require('fs');


// Config
var config = require('../serverConfig'); 
var localIP = config.music.host;
var localPort = config.music.port;
var musicDir = config.music.musicDir;
var fileTypes = config.music.fileTypes;

var solr = config.solr.proxy;
if (solr === undefined) {
  // Update Solr directly if they really want.
  solr = config.solr;
}

var solrHost = solr.host;
var solrPort = solr.port;


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
  pyArgs.concat(fileTypes);


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


cron.CronJob('* */15 * * * *', reindex);


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
