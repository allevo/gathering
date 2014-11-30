'use strict';


var util = require('util');
var ElasticSearchClient = require('elasticsearchclient');

var async = require('../async');
var Sender = require('../sender');

function ElasticSearch(name, config) {
  Sender.call(this, name, config);

  this.client = new ElasticSearchClient(this.config.backends[this.name].server);
  this.config.backends[this.name].countOptions = this.config.backends[this.name].countOptions || {};
  this.config.backends[this.name].timeOptions = this.config.backends[this.name].timeOptions || {};
}
util.inherits(ElasticSearch, Sender);

ElasticSearch.prototype.send = function(data, flushTime, callback) {
  var self = this;

  var countCommands = [];
  var timeCommands = [];

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

    var s, k;

    var innerTasks = [];
    if (hasTime) {
      s = [];
      for (k in res.time) {
        res.time[k].key = k;
        s.push(res.time[k]);
      }
      // Use Object.create to copy the options
      innerTasks.push(self.client.bulk.bind(self.client, s, Object.create(self.config.backends[self.name].timeOptions)));
    }
    if (hasCount) {
      s = [];
      for (k in res.count) {
        res.count[k].key = k;
        s.push(res.count[k]);
      }
      // Use Object.create to copy the options
      innerTasks.push(self.client.bulk.bind(self.client, s, Object.create(self.config.backends[self.name].countOptions)));
    }
    if (hasOs) {
      data.os.flushTime = flushTime;
      // Use Object.create to copy the options
      innerTasks.push(self.client.bulk.bind(self.client, [data.os], Object.create(self.config.backends[self.name].osOptions)));
    }
    
    async.parallel(innerTasks, callback);
  });
};

module.exports = ElasticSearch;
