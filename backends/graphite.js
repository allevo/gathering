'use strict';

var util = require('util');
var net = require('net');

var Sender = require('../sender');

function Graphite(name, config) {
  Sender.call(this, name, config);
  this.port = this.config.backends[this.name].server.port;
  this.host = this.config.backends[this.name].server.host;
  this.basePath = this.config.backends[this.name].basePath;
}
util.inherits(Graphite, Sender);


Graphite.prototype.send = function(data, flushTime, callback) {
  var toSend = [];
  var key, metric;
  for(key in data.time) {
    for(metric in data.time[key]) {
      toSend.push(this.basePath + '.time.' + key + '.' + metric + ' ' + data.time[key][metric] + ' ' + flushTime.getTime());
    }
  }

  for(key in data.count) {
    for(metric in data.count[key]) {
      toSend.push(this.basePath + '.count.' + key + '.' + metric + ' ' + data.count[key][metric] + ' ' + flushTime.getTime());
    }
  }

  for(metric in data.os) {
    toSend.push(this.basePath + '.os.' + metric + ' ' + data.os[metric] + ' ' + flushTime.getTime());
  }

  for(key in data.set) {
    if (data.set[key].length) {
      toSend.push(this.basePath + '.set.' + key + '.length ' + data.set[key].length + ' ' + flushTime.getTime());
    }
  }

  var client = new net.Socket();
  client.connect(this.port, this.host, client.end.bind(client, toSend.join('\n')));
  client.on('close', function(hasError) {
    callback(hasError === false ? undefined 
      : new Error('Error on sending to graphite'));
  });
};

module.exports = Graphite;
