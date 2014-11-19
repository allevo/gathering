'use strict';

var dgram = require('dgram');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

function Receiver() {
	EventEmitter.call(this);
	this.server = dgram.createSocket('udp4');
}
util.inherits(Receiver, EventEmitter);


Receiver.prototype.listen = function(host, port, onListening) {
	var self = this;
	this.server.on('message', function(messages) {
		// buffer to string convertion
		messages = messages.toString().split('\n');
		for (var i in messages) {
			self.emit('message', messages[i]);
		}
	});
	this.server.on('listening', onListening.bind(null, this.server));
	this.server.bind(port, host);
};


Receiver.prototype.close = function(cbk) {
	this.server.on('close', cbk);
	this.server.close();
};

module.exports = Receiver;
