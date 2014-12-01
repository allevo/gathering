/* jshint mocha: true */
'use strict';

var assert = require('assert');
var util = require('util');
var net = require('net');

var Graphite = require('../backends/graphite');


describe('graphite backends', function() {
  var backend = new Graphite('graphite', {
    backends: {
      graphite: {
        server: {
          host: 'graphitehost.com',
          port: 666
        },
        basePath: 'foo.bar'
      }
    }
  });
  describe('one', function() {
    before(function(done) {

      var flushTime = new Date();

      var data = {
        count: {
          foo: {
            sum: 2,
            count: 1,
          }
        },
        time: {
          bar: {
            max: 1,
            min: 1,
            mean: 1.5,
          }
        },
        os: {
          uptime: 111,
          loadavg_1: 1,
          loadavg_5: 2,
          loadavg_15: 1,
        }
      };
      var test = this;

      net.Socket = function() {
        this.connect = function(port, host, cbk) {
          test.port = port;
          test.host = host;
          setTimeout(cbk, 10);
        };
        this.end = function(data) {
          test.data = data;
          this.emit('close', false);
          return true;
        };
      };
      util.inherits(net.Socket, require('events').EventEmitter);

      backend.send(data, flushTime, done);
    });

    it('port should be correct', function() {
      assert.equal(666, this.port);
    });
    it('host should be correct', function() {
      assert.equal('graphitehost.com', this.host);
    });

    describe('data', function() {
      before(function() {
        this.splitted = this.data.split('\n');
      });
      it('has 9 elements', function() {
        assert.equal(9, this.splitted.length);
      });
      it('has all elements that starts with basePath', function() {
        for(var i in this.splitted) {
          assert.equal(0, this.splitted[i].indexOf('foo.bar'));
        }
      });
      it('first elements', function() {
        assert.equal(0, this.splitted[0].indexOf('foo.bar.time.max 1 '));
      });
      it('second elements', function() {
        assert.equal(0, this.splitted[1].indexOf('foo.bar.time.min 1 '));
      });
      it('third elements', function() {
        assert.equal(0, this.splitted[2].indexOf('foo.bar.time.mean 1.5 '));
      });
      it('fourth elements', function() {
        assert.equal(0, this.splitted[3].indexOf('foo.bar.count.sum 2 '));
      });
      it('fifth elements', function() {
        assert.equal(0, this.splitted[4].indexOf('foo.bar.count.count 1 '));
      });
      it('sixth elements', function() {
        assert.equal(0, this.splitted[5].indexOf('foo.bar.os.uptime 111 '));
      });
      it('seventh elements', function() {
        assert.equal(0, this.splitted[6].indexOf('foo.bar.os.loadavg_1 1 '));
      });
      it('eighth elements', function() {
        assert.equal(0, this.splitted[7].indexOf('foo.bar.os.loadavg_5 2 '));
      });
      it('nineth elements', function() {
        assert.equal(0, this.splitted[8].indexOf('foo.bar.os.loadavg_15 1 '));
      });
    });
  });
});