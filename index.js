'use strict';

var fs = require('fs');

var map = require('./async').map;

var Receiver = require('./receiver');
var Aggregator = require('./aggregator');
var Statister = require('./statister');
var Sender = require('./sender');



function Main(configFilename) {
	this.configFilename = configFilename;
	this.data = {
		time: [],
		count: [],
		gauge: [],
	};

	this.receiver = new Receiver();
}

Main.prototype.start = function(cbk) {
	var self = this;
	cbk = cbk || function() {};

	this.readConfig(this.configFilename, function(err, config) {
		if (err) throw err;

		self.config = config;
		self.config.percentiles = self.config.percentiles ? self.config.percentiles : [];
		self.config.metrics = self.config.metrics ? self.config.metrics : ['mean', 'count', 'median', 'max', 'min'];

		self.statister = new Statister(self.config);
		self.aggregator = new Aggregator();
		self.sender = new Sender();

		self.receiver.on('message', self.onMessage.bind(self));

		self.receiver.listen(config.host, config.port, function() {
			self.scheduleFlush();
			cbk();
		});
	});
};

Main.prototype.close = function(cbk) {
	var self = this;
	this.receiver.close(function() {
		self.sender.close(cbk);
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
	this.data = {
		time: [],
		count: [],
		gauge: [],
	};

	var self = this;
	this.aggregator.aggregate(copy, function(err, aggregated) {
		if(err) throw err;

		self.makeStatistic(aggregated, function(err, toSend) {
			if(err) throw err;
			self.flush(toSend);
		});

	});
};

Main.prototype.makeStatistic = function(aggregated, cbk) {
	var self = this;
	map(
		aggregated,
		function(type, next) {
			map(type, self.statister.getAll.bind(self.statister), next);
		},
		cbk
	);
};

Main.prototype.flush = function(toSend) {
	var self = this;

	this.sender.send(toSend, function(err) {
		if (err) throw err;

		if (self.config.onlyOne) {
			clearInterval(self.intervalId);
			process.exit(0);
		}
	});
};

Main.prototype.readConfig = function(filename, cbk) {
	fs.readFile(filename, function(err, data) {
		if (err) return cbk(err);
		cbk(err, JSON.parse(data.toString()));
	});
};

var types = {
	c: 'count',
	ms: 'time',
	g: 'gauge',
};

// metric name and value cannot contain | character
var regexpMessage = /^([^:]+):(\d+)\|(\w)(?:@(\d?\.\d+))?$/;
Main.prototype.parseMessage = function(message, callback) {
	var matches = message.match(regexpMessage);
	if (!matches) {
		return;
	}
	
	return callback({
		name: matches[1],
		value: parseInt(matches[2]),
		type: types[matches[3]],
		sample: matches[4],
	});
};


module.exports = Main;

if (module == require.main) {
	var main = new Main(process.argv[2] || './configuration.json');
	main.start();
}
