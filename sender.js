'use strict';


function Sender(name, config) {
	this.name = name;
	this.config = config;
}

Sender.prototype.send = function(data, flushTime, callback) {
	return callback();
};

Sender.prototype.close = function(cbk) {
	cbk();
};

module.exports = Sender;
