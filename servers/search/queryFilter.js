// queryFilter.js
//
// Implement our own queryFilter so that we can update the index from trusted
// sources.

var fs = require('fs');

var allowedHosts = JSON.parse(fs.readFileSync('../serverConfig.json', 'utf8')).allowedHosts

var handlers = {
  '/solr/select': function(req, query) {
    var filters = {
      qt: function() {return false;}
    }

    for (var param in query) {
      if (!query.hasOwnProperty(param)) {
        continue;
      }

      var q = param.split('.');

      if (typeof(filters[q[0]]) === 'function') {
        if (!filters[q[0]](req, query[param], q.slice(1))) {                 
          return false;
        }
      }
    }
    return true;
  },

  '/solr/update': function(req, query) {
    return allowedHosts.indexOf(req.connection.remoteAddress) >= 0;
  }
};

module.exports = function(req, query, handler) {
  if (typeof(handlers[handler]) === 'function') {
    return handlers[handler](req, query);
  }
  else {
    return false;
  }
};
