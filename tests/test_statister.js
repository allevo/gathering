/* jshint mocha: true, camelcase: false */
'use strict';

var os = require('os');
var assert = require('assert');

var Statister = require('../statister');


describe('statister', function() {
  describe('getTimeStats', function() {
    var elements = [
      {value: 6},
      {value: 6},
      {value: 6},
      {value: 6},
      {value: 6.1},
      {value: 6.2},
      {value: 6.2},
      {value: 6.3},
      {value: 6.3},
      {value: 8.3},
      {value: 10},
      {value: 12},
      {value: 11},
      {value: 9},
      {value: 7},
      {value: 5},
    ];

    describe('90 percentile', function() {
      before(function(done) {
        var statister = new Statister({
          percentiles: [0.9],
          metrics: ['mean', 'count', 'median', 'max', 'min']
        });
        var test = this;

        statister.getTimeStats(elements, function(err, stats) {
          test.err = err;
          test.stats = stats;

          done();
        });
      });

      it('error should be null', function() {
        assert.ifError(this.err);
      });

      describe('stats', function() {
        it('should have 9 keys', function() {
          assert.equal(9, Object.keys(this.stats).length);
        });
        it('should have length', function() {
          assert.equal(elements.length, this.stats.count);
        });
        it('should have median', function() {
          assert.equal(6.25, this.stats.median);
        });
        it('should have mean', function() {
          assert.equal(7.3375, this.stats.mean);
        });
        it('should have max', function() {
          assert.equal(12, this.stats.max);
        });
        it('should have min', function() {
          assert.equal(5, this.stats.min);
        });

        describe('90 percentile', function() {
          it('should have count', function() {
            assert.equal(14, this.stats.count_90);
          });
          it('should have mean', function() {
            assert.equal(7.171428571428572, this.stats.mean_90);
          });
          it('should have max', function() {
            assert.equal(11, this.stats.max_90);
          });
          it('should have min', function() {
            assert.equal(6, this.stats.min_90);
          });
        });
      });
    });

    describe('90 and 60', function() {
      before(function(done) {
        var statister = new Statister({
          percentiles: [0.9 ,0.6],
          metrics: ['mean', 'count', 'median', 'max', 'min']
        });
        var test = this;

        statister.getTimeStats(elements, function(err, stats) {
          test.err = err;
          test.stats = stats;

          done();
        });
      });

      it('error should be null', function() {
        assert.ifError(this.err);
      });

      describe('90', function() {
        it('should have count', function() {
          assert.equal(14, this.stats.count_90);
        });
        it('should have mean', function() {
          assert.equal(7.171428571428572, this.stats.mean_90);
        });
        it('should have max', function() {
          assert.equal(11, this.stats.max_90);
        });
        it('should have min', function() {
          assert.equal(6, this.stats.min_90);
        });
      });

      describe('60', function() {
        it('should have count', function() {
          assert.equal(4, this.stats.count_60);
        });
        it('should have mean', function() {
          assert.equal(6.25, this.stats.mean_60);
        });
        it('should have max', function() {
          assert.equal(6.3, this.stats.max_60);
        });
        it('should have min', function() {
          assert.equal(6.2, this.stats.min_60);
        });
      });
    });

    it('empty', function(done) {
      var statister = new Statister({
        percentiles: [0.9, 0.6],
        metrics: ['mean', 'count', 'median', 'max', 'min']
      });
      statister.getTimeStats([], function(err, stats) {
        assert.equal(null, stats);

        done();
      });
    });
  });

  describe('getCountStats', function() {
    var elements = [
      {value: 1},
      {value: 2},
      {value: 7},
      {value: 1},
      {value: 5},
    ];

    describe('not empty', function() {
      before(function(done) {
        var test = this;

        var statister = new Statister({});
        statister.getCountStats(elements, function(err, stats) {
          test.err = err;
          test.stats = stats;

          done();
        });
      });

      it('err should be null', function() {
        assert.ifError(this.err);
      });

      describe('stats', function() {
        it('should have sum', function() {
          assert.equal(16, this.stats.sum);
        });
        it('should have count', function() {
          assert.equal(elements.length, this.stats.count);
        });
      });
    });

    it('empty', function(done) {
      var statister = new Statister({});
      statister.getCountStats([], function(err, stats) {
        assert.ifError(err);
        assert.equal(null, stats);

        done();
      });
    });
  });

  describe('getOSStats', function() {
    before(function(done) {
      var test = this;

      os.cpus = function() {
        return [ {
          model: 'Intel(R) Core(TM) i7 CPU         860  @ 2.80GHz',
          speed: 2926,
          times: {
            user: 252020,
            nice: 0,
            sys: 30340,
            idle: 1070356870,
            irq: 0
          }
        }, {
          model: 'Intel(R) Core(TM) i7 CPU         860  @ 2.80GHz',
          speed: 2926,
          times: {
            user: 306960,
            nice: 0,
            sys: 26980,
            idle: 1071569080,
            irq: 0
          }
        }];
      };

      var statister = new Statister({
          osStats: 'all',
      });
      statister.getOSStats(function(err, stats) {
        test.err = err;
        test.stats = stats;

        done();
      });
    });

    it('err should be null', function() {
      assert.ifError(this.err);
    });
    it('hostname should be set', function() {
      assert.ok(this.stats.hostname);
      assert.equal('string', typeof this.stats.hostname);
    });
    it('uptime should be set', function() {
      assert.ok(this.stats.uptime);
      assert.equal('number', typeof this.stats.uptime);
    });
    it('freemem should be set', function() {
      assert.ok(this.stats.freemem);
      assert.equal('number', typeof this.stats.freemem);
    });
    it('totalmem should be set', function() {
      assert.ok(this.stats.totalmem);
      assert.equal('number', typeof this.stats.totalmem);
    });
    it('loadavg_1 should be set', function() {
      assert.ok(this.stats.loadavg_1);
      assert.equal('number', typeof this.stats.loadavg_1);
    });
    it('loadavg_5 should be set', function() {
      assert.ok(this.stats.loadavg_5);
      assert.equal('number', typeof this.stats.loadavg_5);
    });
    it('loadavg_15 should be set', function() {
      assert.ok(this.stats.loadavg_15);
      assert.equal('number', typeof this.stats.loadavg_15);
    });
    describe('cpus', function() {
      for(var i = 0; i < 2; i++) {
        /*jshint -W083 */
        var k = i;
        it(k + ' has user', function() {
          assert.equal('number', typeof this.stats['cpus' + k].user);
        });
        it(k + ' has sys', function() {
          assert.equal('number', typeof this.stats['cpus' + k].sys);
        });
        it(k + ' has idle', function() {
          assert.equal('number', typeof this.stats['cpus' + k].idle);
        });
        it(k + ' has irq', function() {
          assert.equal('number', typeof this.stats['cpus' + k].irq);
        });
        it(k + ' has nice', function() {
          assert.equal('number', typeof this.stats['cpus' + k].nice);
        });
      }
    });
  });

  describe('getSetStats', function() {
    before(function(done) {
      var test = this;
      var data = [
        {value: 'pippo'},
        {value: 'pluto'},
        {value: 'pippo'},
        {value: 'paperino'},
        {value: 'pluto'},
        {value: 'pluto'},
        {value: 'pippo'},
        {value: 'pippo'},
        {value: 'paperone'},
        {value: 'pippo'},
        {value: 'pluto'},
        {value: 'pluto'},
      ];
      var statister = new Statister({});
      statister.getSetStats(data, function(err, stats) {
        test.err = err;
        test.stats = stats;

        done();
      });
    });

    it('err should be null', function() {
      assert.ifError(this.err);
    });
    it('length shoud be 4', function() {
      assert.equal(4, this.stats.length);
    });
    it('length shoud be the right array', function() {
      assert.deepEqual(['pippo', 'pluto', 'paperino', 'paperone'], this.stats);
    });
  });

  describe('getGaugeStats', function() {
    describe('must choose last value', function() {
      before(function(done) {
        var test = this;
        var data = [
          {value: '23'},
          {value: '22'},
          {value: '27'},
          {value: '23'},
          {value: '23'},
          {value: '24'},
        ];
        var statister = new Statister({});
        statister.getGaugeStats(data, function(err, stats) {
          test.err = err;
          test.stats = stats;

          done();
        });
      });

      it('err should be null', function() {
        assert.ifError(this.err);
      });
      it('stats', function() {
        assert.equal(24, this.stats);
      });
    });

    describe('with delta', function() {
      before(function(done) {
        var test = this;
        var data = [
          {value: '23'},
          {value: '22'},
          {value: '+27'},
          {value: '+23'},
          {value: '-23'},
          {value: '+24'},
        ];
        var statister = new Statister({});
        statister.getGaugeStats(data, function(err, stats) {
          test.err = err;
          test.stats = stats;

          done();
        });
      });

      it('err should be null', function() {
        assert.ifError(this.err);
      });
      it('stats', function() {
        assert.equal(73, this.stats);
      });
    });
  });
});