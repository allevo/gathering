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
        },
        osOptions
        : {
          _index: 'stats',
          _type: 'os'
        }
      }
    }
  });
  describe('few', function() {
    before(function(done) {
      var test = this;
      var flushTime = new Date();

      this.scope = nock('http://localhost:9200')
        .post('/stats/count/_bulk', {key: 'foo', sum: 2, count: 1, flushTime: flushTime.toISOString()})
        .reply(200, {})
        .post('/stats/time/_bulk', {key: 'bar', max: 1, min: 1, mean: 1.5, flushTime: flushTime.toISOString()})
        .reply(200, {})
        .post('/stats/os/_bulk', {uptime: 1234, loadavg_1: 1, loadavg_5: 15, loadavg_15: 2, flushTime: flushTime.toISOString()})
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
        },
        os: {
          uptime: 1234,
          loadavg_1: 1,
          loadavg_5: 15,
          loadavg_15: 2,
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
        JSON.stringify({sum:2, count:1, flushTime: flushTime.toISOString(), key: 'foo'}),
        JSON.stringify({sum:2, count:1, flushTime: flushTime.toISOString(), key: 'bar'}),
        JSON.stringify({sum:2, count:1, flushTime: flushTime.toISOString(), key: 'foobar'}),
      ].join('\n');
      var timeExpectedBody = [
        JSON.stringify({max: 1, min: 1, mean: 1.5, flushTime: flushTime.toISOString(), key: 'bar'}),
        JSON.stringify({max: 1, min: 1, mean: 1.5, flushTime: flushTime.toISOString(), key: 'foo'}),
        JSON.stringify({max: 1, min: 1, mean: 1.5, flushTime: flushTime.toISOString(), key: 'foobar'}),
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