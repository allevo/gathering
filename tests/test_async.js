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
});
