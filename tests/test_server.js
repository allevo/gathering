/* jshint mocha: true */
'use strict';

var assert = require('assert');

var Main = require('../index');


function send(msg) {
	var dgram = require('dgram');
	var message = new Buffer(msg);

	var client = dgram.createSocket('udp4');
	client.send(message, 0, message.length, 8898, '127.0.0.1', function(err, bytes) {
		if (err) throw err;
		client.close();
	});
}

describe('server', function() {
	before(function(done) {
		var test = this;

		test.main = new Main('./tests/test-configuration.json');
		test.main.start(done);
	});
	after(function(done) {
		this.main.close(done);
	});
	beforeEach(function() {
		this.old = {
			addMessage: this.main.addMessage,
			send: this.main.sender.send,
		};
	});
	afterEach(function() {
		this.main.addMessage = this.old.addMessage;
		this.main.sender.send = this.old.send;
	});

	describe('on message event', function() {
		it('parsing massages in more than one line are accepted', function(done) {
			var n = 0;
			var expecteds = [
				{ name: 'pippo', value: 3, type: 'count', sample: undefined },
				{ name: 'pippo', value: 5, type: 'count', sample: undefined },
				{ name: 'pluto', value: 3, type: 'count', sample: undefined },
			];
			this.main.addMessage = function(message) {
				assert.deepEqual(expecteds[n], message);
				n += 1;
				if (n >= 3) {
					done();
				}
			};

			send('pippo:3|c\npippo:5|c\npluto:3|c');
		});

		it('parsing upd packet with too many slash are accepted', function(done) {
			var n = 0;
			var expecteds = [
				{ name: 'pippo', value: 3, type: 'count', sample: undefined },
				{ name: 'pippo', value: 5, type: 'count', sample: undefined },
				{ name: 'pluto', value: 3, type: 'count', sample: undefined },
			];
			this.main.addMessage = function(message) {
				assert.deepEqual(expecteds[n], message);
				n += 1;
				if (n >= 3) {
					done();
				}
			};

			send('\n\npippo:3|c\n\n\npippo:5|c\n\n\n\npluto:3|c\n\n\n\n\n\n\n\n\n');
		});

		it('parsing empty upd packet should be ignored', function() {
			var n = 0;
			var expecteds = [];
			this.main.addMessage = function(message) {
				assert.equal(true, false);
			};

			send('\n');
		});

		it('malformed upd packet should be ignored', function(done) {
			var n = 0;
			var expected = { name: 'pippo', value: 3, type: 'count', sample: undefined };
			this.main.addMessage = function(message) {
				assert.deepEqual(expected, message);
				done();
			};

			send('helloWorld!\npippo:3|c');
		});

		it('multi messages without EOL are ignored', function() {
			var n = 0;
			var expected = { name: 'pippo', value: 3, type: 'count', sample: undefined };
			this.main.addMessage = function(message) {
				assert.equal(true, false);
			};

			send('pippo:3|cpippo:3|cpippo:3|cpippo:3|c');
		});

		it('stress are not a problem', function(done) {
			var n = 0;
			var expected = 600;
			this.main.addMessage = function(message) {
				n += 1;
				if (n >= expected) {
					done();
				}
			};

			for (var i = 0; i < expected/3; i++) {
				send('pippo:3|c\npippo:5|c\npluto:3|c');
			}
		});
	});

	describe('on flush data', function() {
		it('normal', function(done) {
			var expected = {
				time: {},
				count: {
					pippo: { mean: 4, min: 3, max: 5, count: 2, median: 4 },
					pluto: { mean: 3, min: 3, max: 3, count: 1, median: 3 }
				},
				gauge: {},
			};
			this.main.sender.send = function(data, cbk) {
				assert.deepEqual(expected, data);
				done();
			};

			send('\n\npippo:3|c\n\n\npippo:5|c\n\n\n\npluto:3|c\n\n\n\n\n\n\n\n\n');
		});

		it('empty', function(done) {
			var expected = {
				time: {},
				count: {},
				gauge: {},
			};
			this.main.sender.send = function(data, cbk) {
				assert.deepEqual(expected, data);
				done();
			};

			send('\n\n\n\n\n\n\n\n\n\n');
		});
	});
});
