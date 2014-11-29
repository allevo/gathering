/* jshint mocha: true */
'use strict';

var assert = require('assert');

var Main = require('../index');
var Stdout = require('../backends/stdout');

var old = {
  addMessage: Main.prototype.addMessage,
  flush: Main.prototype.flush,
};

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
  describe('on message', function() {
    before(function(done) {
      var test = this;

      test.main = new Main('./tests/test-configuration.json');
      test.main.start(done);
    });
    beforeEach(function() {
      this.main.addMessage = old.addMessage;
      this.main.flush = old.flush;
    });
    after(function(done) {
      this.main.close(done);
    });

    describe('a simple package is parsed as', function() {
      describe('count type message', function() {
        before(function(done) {
          var test = this;

          this.main.addMessage = function(message) {
            test.message = message;
            done();
          };

          send('pippo:3|c');
        });
        it('should be an object', function() {
          assert.equal('[object Object]', Object.prototype.toString.call(this.message));
        });
        it('should be a count type', function() {
          assert.equal('count', this.message.type);
        });
        it('should have the correct value', function() {
          assert.equal(3, this.message.value);
        });
        it('should have the correct name', function() {
          assert.equal('pippo', this.message.name);
        });
        it('should not be sampled', function() {
          assert.equal(undefined, this.message.undefined);
        });
      });

      describe('time type message', function() {
        before(function(done) {
          var test = this;

          var expected = { name: 'pippo', value: 3, type: 'time', sample: undefined };
          this.main.addMessage = function(message) {
            test.message = message;
            done();
          };

          send('pippo:3|ms');
        });

        it('should be an object', function() {
          assert.equal('[object Object]', Object.prototype.toString.call(this.message));
        });
        it('should be a time type', function() {
          assert.equal('time', this.message.type);
        });
        it('should have the correct value', function() {
          assert.equal(3, this.message.value);
        });
        it('should have the correct name', function() {
          assert.equal('pippo', this.message.name);
        });
        it('should not be sampled', function() {
          assert.equal(undefined, this.message.undefined);
        });
      });
    });

    describe('a multiple line package is parsed as', function() {
      describe('mixed type messages', function() {
        before(function(done) {
          var n = 0;
          var test = this;
          test.messages = [];

          this.main.addMessage = function(message) {
            test.messages.push(message);
            
            n += 1;
            if (n >= 3) {
              done();
            }
          };

          send('pippo:3|ms\npippo:5|c\npluto:3|ms');
        });
        it('length 3', function() {
          assert.equal(3, this.messages.length);
        });
        it('and the first is the first', function() {
          assert.equal('pippo', this.messages[0].name);
          assert.equal(3, this.messages[0].value);
          assert.equal('time', this.messages[0].type);
        });
        it('and the second is the second', function() {
          assert.equal('pippo', this.messages[1].name);
          assert.equal(5, this.messages[1].value);
          assert.equal('count', this.messages[1].type);
        });
        it('and the third is the third', function() {
          assert.equal('pluto', this.messages[2].name);
          assert.equal(3, this.messages[2].value);
          assert.equal('time', this.messages[2].type);
        });
      });
    });

    describe('all empty lines', function() {
      before(function(done) {
        var test = this;
        test.n = 0;
        this.main.addMessage = function(message) {
          test.n++;

          done();
        };

        send('\n\n\n\n\npippo:5|c\n\n\n\n\n\n\n\n\n\n\n\n\n');
      });
      it('should be ignored', function() {
        assert.equal(1, this.n);

      });
    });

    describe('malformed messages', function() {
      before(function(done) {
        var test = this;
        test.n = 0;

        this.main.addMessage = function (message) {
          test.n++;

          done();
        };

        send('helloWorld!\npippo:3|c');
      });
      it('are ignored', function() {
        assert.equal(1, this.n);
      });
    });

    describe('support UTF-8', function() {
      before(function(done) {
        var test = this;

        this.main.addMessage = function(message) {
          test.message = message;
          done();
        };

        send('☃🎅\t἖℃:3|c');
      });

      it('should works with ☃🎅\t἖℃', function() {
        assert.equal('☃🎅\t἖℃', this.message.name);
      });
    });
  });

  describe('addMessage', function() {
    before(function(done) {
      var test = this;

      test.main = new Main('./tests/test-configuration.json');
      test.main.start(function() {
        test.main.close(done);
      });
    });

    describe('add message really', function() {
      before(function() {
        this.main.addMessage({type: 'count', value: 2, name: 'foo'});
      });

      it('adding message in data', function() {
        assert.equal(1, this.main.data.count.length);
      });
    });
  });

  describe('processing flow', function() {
    describe('not empty', function() {
      before(function(done) {
        var test = this;

        test.main = new Main('./tests/test-configuration.json');
        test.main.start(function() {
          test.main.close(done);
        });
      });
      before(function(done) {
        var test = this;

        test.main.addMessage({type: 'count', value: 1, name: 'pippo'});
        test.main.addMessage({type: 'count', value: 5, name: 'pippo'});
        test.main.addMessage({type: 'count', value: 2, name: 'pluto'});
        test.main.addMessage({type: 'time', value: 1.44, name: 'pippo'});
        test.main.addMessage({type: 'time', value: 4.02, name: 'pippo'});
        test.main.addMessage({type: 'time', value: 7.55, name: 'pluto'});

        test.main.flush = function(toSend) {
          test.toSend = toSend;

          done();
        };
        test.main.aggregate();
      });

      describe('test', function() {
        describe('count', function() {
          it('should have pippo', function() {
            assert.equal(true, 'pippo' in this.toSend.count);
          });
          it('should have pluto', function() {
            assert.equal(true, 'pluto' in this.toSend.count);
          });
        });
        describe('time', function() {
          it('should have pippo', function() {
            assert.equal(true, 'pippo' in this.toSend.time);
          });
          it('should have pluto', function() {
            assert.equal(true, 'pluto' in this.toSend.time);
          });
        });
        describe('os', function() {
          it('should be ok', function() {
            assert.ok(this.toSend.os);
          });
        });
      });
    });

    describe('empty', function() {
      before(function(done) {
        var test = this;

        test.main = new Main('./tests/test-configuration.json');
        test.main.start(function() {
          test.main.close(done);
        });
      });
      before(function(done) {
        var test = this;

        test.main.flush = function(toSend) {
          test.toSend = toSend;

          done();
        };

        test.main.aggregate();
      });

      it('err should be null', function() {
        assert.ifError(this.err);
      });
      
      describe('test', function() {
        it('should have count', function() {
          assert.equal(true, 'count' in this.toSend);
        });
        it('should have time', function() {
          assert.equal(true, 'time' in this.toSend);
        });
        describe('os', function() {
          it('should be ok', function() {
            assert.ok(this.toSend.os);
          });
        });
      });
    });
  });

  describe('on flush data', function() {
    before(function(done) {
      var test = this;

      test.main = new Main('./tests/test-configuration-with-backends.json');
      test.main.start(function() {
        test.main.close(done);
      });
    });
    beforeEach(function() {
      this.main.addMessage = old.addMessage;
      this.main.flush = old.flush;
    });

    it('should call each backends', function(done) {
      var test = this;
      var n = 0;

      this.main.backends.stdout1.send = function(data, flushTime, callback) {
        n++;
        if (n === 3) { done(); }
      };
      this.main.backends.stdout2.send = function(data, flushTime, callback) {
        n++;
        if (n === 3) { done(); }
      };
      this.main.backends.stdout3.send = function(data, flushTime, callback) {
        n++;
        if (n === 3) { done(); }
      };

      this.main.flush({foo: 1});
    });
  });
});
