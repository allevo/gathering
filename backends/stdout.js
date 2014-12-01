'use strict';


var util = require('util');

var Sender = require('../sender');

function Stdout(name, config) {
	Sender.call(this, name, config);
}
util.inherits(Stdout, Sender);

Stdout.prototype.send = function(data, flushTime, callback) {
  /* jshint camelcase: false */
	console.log(flushTime[this.config.backends[this.name].date_function](), util.inspect(data, {deep: false}));
	process.nextTick(callback);
};

module.exports = Stdout;
