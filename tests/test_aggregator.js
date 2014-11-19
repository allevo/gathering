/* jshint mocha: true */
'use strict';

var assert = require('assert');

var Aggregator = require('../aggregator');


describe('aggregator', function() {
	before(function() {
		this.aggregator = new Aggregator();
	});

	it('aggregate', function(done) {
		var data = {
			count: [
				{ name: 'pippo', value: 3, type: 'count', sample: undefined },
				{ name: 'pippo', value: 5, type: 'count', sample: undefined },
				{ name: 'pluto', value: 3, type: 'count', sample: undefined },
			],
			time: [
				{ name: 'pluto', value: 3, type: 'time', sample: undefined },
				{ name: 'pippo', value: 3, type: 'time', sample: undefined },
				{ name: 'pippo', value: 3, type: 'time', sample: undefined },
			],
		};

		this.aggregator.aggregate(data, function(err, aggregated) {
			assert.ok('count' in aggregated);
			assert.ok('pippo' in aggregated.count);
			assert.ok('pluto' in aggregated.count);

			assert.equal(2, aggregated.count.pippo.length);
			assert.equal(1, aggregated.count.pluto.length);

			assert.ok('time' in aggregated);
			assert.ok('pippo' in aggregated.time);
			assert.ok('pluto' in aggregated.time);

			assert.equal(2, aggregated.time.pippo.length);
			assert.equal(1, aggregated.time.pluto.length);

			done();
		});
	});

	it('only key', function(done) {
		var data = {
			count: [],
			time: []
		};

		this.aggregator.aggregate(data, function(err, aggregated) {
			assert.ok('count' in aggregated);
			assert.ok('time' in aggregated);

			assert.equal(0, Object.keys(aggregated.count).length);
			assert.equal(0, Object.keys(aggregated.time).length);

			done();
		});
	});

	it('empty', function(done) {
		var data = {};

		this.aggregator.aggregate(data, function(err, aggregated) {
			assert.equal(0, Object.keys(aggregated).length);

			done();
		});
	});
});