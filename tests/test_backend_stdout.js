/* jshint mocha: true, camelcase: false */
'use strict';

var assert = require('assert');
var util = require('util');
var Stdout = require('../backends/stdout');


var old = {
  log: console.log
};

describe('stdout backend', function() {
  before(function(done) {
    var test = this;
    var stdout = new Stdout('foo', {
      backends: {
        foo: {
          date_function: 'toISOString'
        }
      }
    });

    test.log = [];
    console.log = function() {
      test.log.push(arguments);
      console.log = old.log;
    };

    test.data = {
      count: {
        foo: {
          sum: 2,
          count: 1,
        }
      },
      time: {
        foo: {
          min: 3,
          max: 4,
          mean: 3.5,
        }
      },
      set: {
        users: [ 'foo', 'bar', 'foobar' ]
      }
    };
    stdout.send(test.data, new Date(), done);
  });
  after(function() {
    console.log = old.log;
  });

  describe('call console.log', function() {
    it('should be called', function() {
      assert.equal(1, this.log.length);
    });
    it('should be called with date', function() {
      assert.ok(new Date(this.log[0]['0']));
    });
    it('should be called with data', function() {
      assert.deepEqual(util.inspect(this.data, {deep: true}), this.log[0]['1']);
    });
  });
});