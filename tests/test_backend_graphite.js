/* jshint mocha: true */
'use strict';

var assert = require('assert');
var util = require('util');
var Socket = require('net').Socket;

var Graphite = require('../backends/graphite');


describe('graphite backends', function() {
  var backend = new Graphite('graphite', {
    backends: {
      graphite: {
        server: {
          host: 'carbon.hostedgraphite.com',
          port: 2003
        },
        basePath: 'foo.bar'
      }
    }
  });
  describe('one', function() {
    before(function(done) {
      this.timeout(30000);

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
        }
      };
      var test = this;
      Socket.prototype.end = function(data, cbk) {
        test.data = data;
        this.destroy();
      };
      backend.send(data, flushTime, done);
    });

    describe('data', function() {
      before(function() {
        this.splitted = this.data.split('\n');
      });
      it('has 7 elements', function() {
        assert.equal(5, this.splitted.length);
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
    });
  });
});