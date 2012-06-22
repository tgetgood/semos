// proxy.js
//

var solrProxy = require('./node-proxies/solrProxy');
var filter = require('./queryFilter');
var proxyOptions = {
  host: 'localhost',
  port: 8080
};

solrProxy.createProxy(proxyOptions, filter).listen(8008);
