'use strict';

var fs = require('fs');

var map = require('./async').map;

var Receiver = require('./receiver');
var Aggregator = require('./aggregator');
var Statister = require('./statister');


function Main(configFilename) {
  this.configFilename = configFilename;
  this.cleanStats();

  this.receiver = new Receiver();
}

Main.prototype.cleanStats = function() {
  this.data = {
    time: [],
    count: [],
    gauge: [],
    set: [],
  };
};

Main.prototype.start = function(cbk) {
  var self = this;
  cbk = cbk || function() {};
  self.backends = {};

  this.readConfig(this.configFilename, function(err, config) {
    if (err) { throw err; }

    self.config = config;
    self.config.percentiles = self.config.percentiles || [];
    self.config.metrics = self.config.metrics || ['mean', 'count', 'median', 'max', 'min'];

    self.statister = new Statister(self.config);
    self.aggregator = new Aggregator();

    for(var backend in config.backends) {
      var bConfig = config.backends[backend];
      var Cls = require(bConfig.path);
      self.backends[backend] = new Cls(backend, config);
    }

    self.receiver.on('message', self.onMessage.bind(self));

    self.receiver.listen(config.host, config.port, function() {
      self.scheduleFlush();
      cbk();
    });
  });
};

Main.prototype.exit = function() {
  console.log('Exiting...');
  this.close(process.exit.bind(null, 0));
};

Main.prototype.close = function(cbk) {
  var self = this;
  clearInterval(this.intervalId);
  this.receiver.close(function() {
    map(self.backends, function(backend, next) {
      backend.close(next);
    }, cbk);
  });
};

Main.prototype.onMessage = function(message) {
  this.parseMessage(message, this.addMessage.bind(this));
};

Main.prototype.addMessage = function(parsed) {
  this.data[parsed.type].push(parsed);
};

Main.prototype.scheduleFlush = function() {
  this.intervalId = setInterval(this.aggregate.bind(this), this.config.flushInterval);
};

Main.prototype.aggregate = function() {
  var copy = this.data;
  this.cleanStats();

  var self = this;
  this.aggregator.aggregate(copy, function(err, aggregated) {
    if(err) { throw err; }

    self.makeStatistic(aggregated, function(err, toSend) {
      if(err) { throw err; }
      self.flush(toSend);
    });

  });
};

Main.prototype.makeStatistic = function(aggregated, cbk) {
  aggregated.count = aggregated.count || {};
  aggregated.time = aggregated.time || {};
  aggregated.set = aggregated.set || {};

  map({
    count: map.bind(null, aggregated.count, this.statister.getCountStats.bind(this.statister)),
    time: map.bind(null, aggregated.time, this.statister.getTimeStats.bind(this.statister)),
    os: this.statister.getOSStats.bind(this.statister),
    set: map.bind(null, aggregated.set, this.statister.getSetStats.bind(this.statister)),
  }, function(item, next) {
    item(next);
  }, cbk);
};

Main.prototype.flush = function(toSend) {
  var self = this;
  var flushTime = new Date();

  map(this.backends, function(backend, next) {
    backend.send(toSend, flushTime, next);
  }, function(err) {
    if (err) {
      console.log(err);
    }

    if (self.config.onlyOne) {
      console.log('Exit due onlyOne config.set to true');
      self.exit();
    }
  });
};

Main.prototype.readConfig = function(filename, cbk) {
  fs.readFile(filename, function(err, data) {
    if (err) { return cbk(err); }
    cbk(err, JSON.parse(data.toString()));
  });
};

var types = {
  c: 'count',
  ms: 'time',
  s: 'set',
};

Main.prototype.getValue = function(str) {
  if (str === '') { return str; }
  return Number(str) || str;
};

// metric name and value cannot contain | character
var regexpMessage = /^([^:]+):([^\|]+)\|(\w{1,2})(?:@(\d?\.\d+))?$/;
Main.prototype.parseMessage = function(message, callback) {
  var matches = message.match(regexpMessage);
  if (!matches) { return; }
  
  return callback({
    name: matches[1],
    value: this.getValue(matches[2]),
    type: types[matches[3]],
    sample: matches[4],
  });
};


module.exports = Main;

if (module === require.main) {
  var main = new Main(process.argv[2] || './configuration.json');
  main.start(function() {
    console.log('The daemon is running...');
  });
}
