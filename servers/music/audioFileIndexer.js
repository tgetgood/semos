// audioFileIndexer.js
//
// Traverse the specified directories, and post metadata about every audio file
// found to Solr.
//

var fs = require('fs');
var ID3 = require('id3');
var mime = require('mime');
var http = require('http');

// Sync is bad, but this only runs on initialisation and *should* be very fast.
var serverData = JSON.parse(fs.readFileSync('../serverConfig.json', 'utf8')).music;
var topDirs = serverData.musicDirs;
var hostname = serverData.host;
var port = serverData.port;

/** Taken from https://gist.github.com/814063
 *
 * Call fileHandler with the file name and file Stat for each file found inside
 * of the provided directory.
 *
 * Call the optionally provided completeHandler with an array of files (mingled
 * with directories) and an array of Stat objects (one for each of the found
 * files.
 *
 * Following is an example of a simple usage:
 *
 *   eachFileOrDirectory('test/', function(err, file, stat) {
 *     if (err) throw err;
 *     if (!stat.isDirectory()) {
 *       console.log(">> Found file: " + file);
 *     }
 *   });
 *
 * Following is an example that waits for all files and directories to be 
 * scanned and then uses the entire result to do somthing:
 *
 *   eachFileOrDirectory('test/', null, function(files, stats) {
 *     if (err) throw err;
 *     var len = files.length;
 *     for (var i = 0; i < len; i++) {
 *       if (!stats[i].isDirectory()) {
 *         console.log(">> Found file: " + files[i]);
 *       }
 *     }
 *   });
 */
var eachFileOrDirectory = function(directory, fileHandler, completeHandler) {
  var filesToCheck = 0;
  var checkedFiles = [];
  var checkedStats = [];

  directory = (directory) ? directory : './';

  var fullFilePath = function(dir, file) {
    return dir.replace(/\/$/, '') + '/' + file;
  };

  var checkComplete = function() {
    if (filesToCheck == 0 && completeHandler) {
      completeHandler(null, checkedFiles, checkedStats);
    }
  };

  var onFileOrDirectory = function(fileOrDirectory) {
    filesToCheck++;
    fs.stat(fileOrDirectory, function(err, stat) {
      filesToCheck--;
      if (err) return fileHandler(err);
      checkedFiles.push(fileOrDirectory);
      checkedStats.push(stat);
      fileHandler(null, fileOrDirectory, stat);
      if (stat.isDirectory()) {
        onDirectory(fileOrDirectory);
      }
      checkComplete();
    });
  };

  var onDirectory = function(dir) {
    filesToCheck++;
    fs.readdir(dir, function(err, files) {
      filesToCheck--;
      if (err) return fileHandler(err);
      files.forEach(function(file, index) {
        file = fullFilePath(dir, file);
        onFileOrDirectory(file);
      });
      checkComplete();
    });
  }

  onFileOrDirectory(directory);
};

/** Taken from https://gist.github.com/814063
 *
 * Recursivly, asynchronously traverse the file system calling the provided 
 * callback for each file (non-directory) found.
 *
 * Traversal will begin on the provided path.
 */
var eachFile = function(path, callback, completeHandler) {
  var files = [];
  var stats = [];

  eachFileOrDirectory(path, function(err, file, stat) {
    if (err) return callback(err);
    if (!stat.isDirectory()) {
      files.push(file);
      stats.push(stat);
      if (callback) callback(null, file, stat);
    }
  }, function(err) {
    if (err) return completeHandler(err);
    if (completeHandler) completeHandler(null, files, stats);
  });
};


// We're going to accept any file whose mimetype is some form of audio.
var audioCheck = new RegExp(/^audio\//);
audioCheck.compile();

// Constant; how many items to send to solr per request
var itemsPerReq = 50;

var sendData = function(data) {
  var body = JSON.stringify(data);
  var client = http.createClient(8080, '127.0.0.1');
  var req = client.request('POST', '/solr/update/json?commit=true', 
                           {'Content-type': 'application/json'
                            });
  req.write(body);
  req.end();
  req.on('response', function(res) {
    if (res.statusCode !== 200) {
      console.log("Error posting to server.")
      console.log(res.statusCode);
    }
    else {
      console.log("good.");
    }
  });
};

var data = [];
var postToIndex = function(fileData) {
  data.push(fileData);
  if (data.length >= itemsPerReq) {
    sendData(data);
    data = [];
  }
};

var indexFile = function(filePath) {
  var indexData = {};
  fs.readFile(filePath, function(err, file) {
    if (err) {
      console.log("Could not read " + filePath + ": " + err);
      return;
    }
    var tags = new ID3(file);
    tags.parse();

    indexData.title = tags.get('title') === null ? '' : tags.get('title');
    indexData.artist = tags.get('artist') === null ? '' : tags.get('artist');
    indexData.album = tags.get('album') === null ? '' : tags.get('album');
    indexData.genre = tags.get('genre') === null ? '' : tags.get('genre');
    indexData.track = tags.get('track') === null ? '' : tags.get('track');
    indexData.year = tags.get('year') === null ? '' : tags.get('year');

    indexData.path = 'http://' + hostname + ':' + port + filePath;

    postToIndex(indexData);
  });
};

module.exports = function() {
  for (var i = 0; i < topDirs.length; i++) {
    eachFile(topDirs[i], function(err, file, stat) {
      if (file.match(/mp3$|ogg$|flac$/)) {
        indexFile(file);
      }
    });
  }
};
