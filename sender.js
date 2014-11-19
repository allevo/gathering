'use strict';


function Sender() {

}

Sender.prototype.send = function(data, callback) {
	return callback(null);
};

Sender.prototype.close = function(cbk) {
	cbk();
};

module.exports = Sender;
