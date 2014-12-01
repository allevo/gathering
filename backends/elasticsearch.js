'use strict';


var util = require('util');
var http = require('http');

var async = require('../async');
var Sender = require('../sender');

function ElasticSearch(name, config) {
  Sender.call(this, name, config);

  this.config.backends[this.name].countOptions = this.config.backends[this.name].countOptions || {};
  this.config.backends[this.name].timeOptions = this.config.backends[this.name].timeOptions || {};
}
util.inherits(ElasticSearch, Sender);

ElasticSearch.prototype.bulk = function(index, type, body, callback) {
  if (!Array.isArray(body)) {
    return callback(new Error('Body should be an array'));
  }
  var options = {
    path: '/' + index + '/' + type + '/_bulk',
    method: 'POST',
    host: this.config.backends[this.name].server.host,
    port: this.config.backends[this.name].server.port
  };

  var requestCallback = function(response) {
    var retBody = '';
    response.on('data', function (chunk) {
      retBody += chunk;
    });

    response.on('end', function () {
      var err = null;
      var json;
      if (response.statusCode !== 200) {
        err = new Error('Wrong statusCode: ' + response.statusCode);
      }
      try {
        json = JSON.parse(retBody);
      } catch(e) {
        err = new Error('Invalid json');
      }
      if (json.errors !== false) {
        err = new Error('Errors found');
      }
      if (err) {
        err.responseBody = retBody;
        return callback(err);
      }
      callback(null, json);
    });
    response.on('error', callback);
  };

  var request = http.request(options, requestCallback);
  request.on('error', callback);
  for(var i in body) {
    request.write('{"create":{}}\n');
    request.write(JSON.stringify(body[i]));
  }
  request.write('\n');
  request.end();
};

ElasticSearch.prototype.send = function(data, flushTime, callback) {
  var self = this;

  var hasCount = self.config.backends[self.name].countOptions &&  data.count && Object.keys(data.count).length !== 0;
  var hasTime = self.config.backends[self.name].timeOptions && data.time && Object.keys(data.time).length !== 0;
  var hasOs = self.config.backends[self.name].osOptions && data.os && Object.keys(data.os).length !== 0;

  var tasks = {};
  if (hasCount) {
    tasks.count = async.map.bind(null, data.count, function(item, next) {
      item.flushTime = flushTime;
      next(null, item);
    });
  }
  if (hasTime) {
    tasks.time = async.map.bind(null, data.time, function(item, next) {
      item.flushTime = flushTime;
      next(null, item);
    });
  }

  async.map(tasks, function(item, next) {
    item(next);
  }, function(err, res) {
    if (err) { return callback(err); }

    var s, k, options;

    var innerTasks = [];
    if (hasTime) {
      s = [];
      for (k in res.time) {
        res.time[k].key = k;
        s.push(res.time[k]);
      }
      options = self.config.backends[self.name].timeOptions;
      innerTasks.push(self.bulk.bind(self, options._index, options._type, s));
    }
    if (hasCount) {
      s = [];
      for (k in res.count) {
        res.count[k].key = k;
        s.push(res.count[k]);
      }
      options = self.config.backends[self.name].countOptions;
      innerTasks.push(self.bulk.bind(self, options._index, options._type, s));
    }
    if (hasOs) {
      data.os.flushTime = flushTime;
      options = self.config.backends[self.name].osOptions;
      innerTasks.push(self.bulk.bind(self, options._index, options._type, [data.os]));
    }
    
    async.parallel(innerTasks, callback);
  });
};

module.exports = ElasticSearch;
