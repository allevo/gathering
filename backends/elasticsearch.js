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
  var countCommands = [];
  var timeCommands = [];

  var self = this;

  async.parallel([
    async.map.bind(null, data.count, function(item, next) {
      item.flushTime = flushTime;
      countCommands.push(item);
      next();
    }),
    async.map.bind(null, data.time, function(item, next) {
      item.flushTime = flushTime;
      timeCommands.push(item);
      next();
    }),
  ], function(err) {
    if (err) { return callback(err); }
    
    // Use Object.create to copy the options
    async.parallel([
      self.client.bulk.bind(self.client, countCommands, Object.create(self.config.backends[self.name].countOptions)),
      self.client.bulk.bind(self.client, timeCommands, Object.create(self.config.backends[self.name].timeOptions)),
    ], callback);
  });
};

module.exports = ElasticSearch;
