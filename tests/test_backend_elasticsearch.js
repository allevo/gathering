/* jshint mocha: true */
'use strict';

var assert = require('assert');
var util = require('util');
var nock = require('nock');
var ElasticSearch = require('../backends/elasticsearch');


describe('elasticsearch backends', function() {
  var backend = new ElasticSearch('elasticsearch', {
    backends: {
      elasticsearch: {
        server: {
          host: 'localhost',
          port: 9200
        },
        timeOptions: {
          _index: 'stats',
          _type: 'time'
        },
        countOptions: {
          _index: 'stats',
          _type: 'count'
        }
      }
    }
  });
  describe('one', function() {

    before(function(done) {
      var test = this;
      var flushTime = new Date();

      this.scope = nock('http://localhost:9200')
        .post('/stats/count/_bulk', {sum: 2, count: 1, flushTime: flushTime.toISOString()})
        .reply(200, {})
        .post('/stats/time/_bulk', {max: 1, min: 1, mean: 1.5, flushTime: flushTime.toISOString()})
        .reply(200, {});


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
      backend.send(data, flushTime, done);
    });

    it('api should be called', function() {
      this.scope.done();
    });
  });

  describe('multiple', function() {
    before(function(done) {
      var test = this;
      var flushTime = new Date();

      var countExpectedBody = [
        JSON.stringify({sum:2, count:1, flushTime: flushTime.toISOString()}),
        JSON.stringify({sum:2, count:1, flushTime: flushTime.toISOString()}),
        JSON.stringify({sum:2, count:1, flushTime: flushTime.toISOString()}),
      ].join('\n');
      var timeExpectedBody = [
        JSON.stringify({max: 1, min: 1, mean: 1.5, flushTime: flushTime.toISOString()}),
        JSON.stringify({max: 1, min: 1, mean: 1.5, flushTime: flushTime.toISOString()}),
        JSON.stringify({max: 1, min: 1, mean: 1.5, flushTime: flushTime.toISOString()}),
      ].join('\n');


      this.scope = nock('http://localhost:9200')
        .post('/stats/count/_bulk', countExpectedBody)
        .reply(200, {})
        .post('/stats/time/_bulk', timeExpectedBody)
        .reply(200, {});

      var data = {
        count: {
          foo: {
            sum: 2,
            count: 1,
          },
          bar: {
            sum: 2,
            count: 1,
          },
          foobar: {
            sum: 2,
            count: 1,
          }
        },
        time: {
          bar: {
            max: 1,
            min: 1,
            mean: 1.5,
          },
          foo: {
            max: 1,
            min: 1,
            mean: 1.5,
          },
          foobar: {
            max: 1,
            min: 1,
            mean: 1.5,
          }
        }
      };
      backend.send(data, flushTime, done);
    });

    it('api should be called', function() {
      this.scope.done();
    });
  });
});