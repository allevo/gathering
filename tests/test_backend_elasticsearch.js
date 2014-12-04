/* jshint mocha: true, camelcase: false */
'use strict';

var assert = require('assert');
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
        osOptions: {
          _index: 'stats',
          _type: 'os'
        },
        setOptions: {
          _index: 'stats',
          _type: 'set'
        },
        gaugeOptions: {
          _index: 'stats',
          _type: 'gauge'
        }
      }
    }
  });

  describe('bulk', function() {
    before(function(done) {
      var test = this;

      this.scope = nock('http://localhost:9200')
        .post('/foo/bar/_bulk', '{"create":{}}\n{"pippo":1,"pluto":2}\n')
        .reply(200, {errors: false, status: 201});

      var data = [{pippo: 1, pluto: 2}];
      backend.bulk('foo', 'bar', data, function(err, body) {
        test.err = err;
        test.body = body;

        done();
      });
    });

    it('api should be called', function() {
      this.scope.done();
    });

    it('err should be null', function() {
      assert.equal(null, this.err);
    });
  });

  describe('few', function() {
    before(function(done) {
      var flushTime = new Date();

      var countBody = '{"create":{}}\n{"sum":2,"count":1,"flushTime":"' + flushTime.toISOString() + '","key":"foo"}\n';
      var timeBody = '{"create":{}}\n{"max":1,"min":1,"mean":1.5,"flushTime":"' + flushTime.toISOString() + '","key":"bar"}\n';
      var osBody = '{"create":{}}\n{"uptime":1234,"loadavg_1":1,"loadavg_5":15,"loadavg_15":2,"flushTime":"' + flushTime.toISOString() + '"}\n';
      var setBody = '{"create":{}}\n{"flushTime":"' + flushTime.toISOString() + '","values":["foo","bar","foobar"],"key":"users"}\n';
      var gaugeBody = '{"create":{}}\n{"foobar":22,"barfoo":64,"flushTime":"' + flushTime.toISOString() + '"}\n';

      this.scope = nock('http://localhost:9200')
        .post('/stats/count/_bulk', countBody)
        .reply(200, {})
        .post('/stats/time/_bulk', timeBody)
        .reply(200, {})
        .post('/stats/set/_bulk', setBody)
        .reply(200, {})
        .post('/stats/gauge/_bulk', gaugeBody)
        .reply(200, {})
        .post('/stats/os/_bulk', osBody)
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
        },
        gauge: {
          foobar: 22,
          barfoo: 64,
        },
        set: {
          users: ['foo', 'bar', 'foobar']
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
      var flushTime = new Date();

      var countExpectedBody = [
        JSON.stringify({create:{}}),
        JSON.stringify({sum:2, count:1, flushTime: flushTime.toISOString(), key: 'foo'}),
        JSON.stringify({create:{}}),
        JSON.stringify({sum:2, count:1, flushTime: flushTime.toISOString(), key: 'bar'}),
        JSON.stringify({create:{}}),
        JSON.stringify({sum:2, count:1, flushTime: flushTime.toISOString(), key: 'foobar'}),
      ].join('\n') + '\n';
      var timeExpectedBody = [
        JSON.stringify({create:{}}),
        JSON.stringify({max: 1, min: 1, mean: 1.5, flushTime: flushTime.toISOString(), key: 'bar'}),
        JSON.stringify({create:{}}),
        JSON.stringify({max: 1, min: 1, mean: 1.5, flushTime: flushTime.toISOString(), key: 'foo'}),
        JSON.stringify({create:{}}),
        JSON.stringify({max: 1, min: 1, mean: 1.5, flushTime: flushTime.toISOString(), key: 'foobar'}),
      ].join('\n') + '\n';
      var setExpectedBody = [
        JSON.stringify({create:{}}),
        JSON.stringify({flushTime: flushTime.toISOString(), values: ['pippo', 'pluto'], key: 'bar'}),
        JSON.stringify({create:{}}),
        JSON.stringify({flushTime: flushTime.toISOString(), values: ['paperino', 'paperone'], key: 'foo'}),
      ].join('\n') + '\n';

      this.scope = nock('http://localhost:9200')
        .post('/stats/count/_bulk', countExpectedBody)
        .reply(200, {})
        .post('/stats/time/_bulk', timeExpectedBody)
        .reply(200, {})
        .post('/stats/set/_bulk', setExpectedBody)
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
        },
        set: {
          bar: ['pippo', 'pluto'],
          foo: ['paperino', 'paperone'],
        }
      };
      backend.send(data, flushTime, done);
    });

    it('api should be called', function() {
      this.scope.done();
    });
  });
});