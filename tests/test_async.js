/* jshint mocha: true */
'use strict';

var assert = require('assert');

var async = require('../async');


describe('async', function() {
  describe('map', function() {
    describe('object', function() {
      it('normal', function(done) {
        var obj = {a: 1, b: 2, c: 3};
        async.map(obj, function(item, next) {
          next(null, item * item);
        }, function(err, res) {
          assert.deepEqual({a: 1, b: 4, c: 9}, res);
          done();
        });
      });

      it('empty', function(done) {
        var obj = {};
        async.map(obj, function(item, next) {
          next(null, item * item);
        }, function(err, res) {
          assert.deepEqual({}, res);
          done();
        });
      });
    });

    describe('array', function() {
      it('normal', function(done) {
        var obj = [1, 2, 3];
        async.map(obj, function(item, next) {
          next(null, item * item);
        }, function(err, res) {
          assert.deepEqual([1, 4, 9], res);
          done();
        });
      });

      it('empty', function(done) {
        var obj = [];
        async.map(obj, function(item, next) {
          next(null, item * item);
        }, function(err, res) {
          assert.deepEqual([], res);
          done();
        });
      });
    });
  });
  
  describe('parallel', function() {
    var func1Called = false;
    var func2Called = false;

    function func1(next) {
      func1Called = true;
      setTimeout(next, 1);
    }
    function func2(next) {
      func2Called = true;
      setTimeout(next, 100);
    }

    describe('array', function() {
      before(function(done) {
        async.parallel([func1, func2], done);
      });
      after(function() {
        func1Called = false;
        func2Called = false;
      });

      it('func1 should be called', function() {
        assert.equal(true, func1Called);
      });
      it('func2 should be called', function() {
        assert.equal(true, func2Called);
      });
    });
  });
});
