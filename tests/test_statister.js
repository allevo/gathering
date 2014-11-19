/* jshint mocha: true */
'use strict';

var crypto = require('crypto');
var assert = require('assert');

var Statister = require('../statister');


function _averange(arr) {
	return arr.reduce(function(prev, current) { return prev + current; }, 0) / arr.length;
}

function getRandom(n) {
	var buffer = crypto.randomBytes(n);
	var elements = [];
	for (var i=0; i < n; i++) {
		elements.push({value: buffer[i]});
	}
	return elements;
}

describe('statister', function() {

	describe('getAll', function() {
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

		it('90', function(done) {
			var statister = new Statister({
				percentiles: [0.9],
				metrics: ['mean', 'count', 'median', 'max', 'min']
			});
			statister.getAll(elements, function(err, stats) {
				assert.equal(8, Object.keys(stats).length);

				assert.equal(elements.length, stats.count);
				assert.equal(7.3375, stats.mean);
				assert.equal(6.25, stats.median);
				assert.equal(12, stats.max);
				assert.equal(5, stats.min);

				assert.equal(7.723076923076923, stats.mean_90);
				assert.equal(11, stats.upper_90);
				assert.equal(6, stats.lower_90);

				done();
			});
		});

		it('60', function(done) {
			var statister = new Statister({
				percentiles: [0.6],
				metrics: ['mean', 'count', 'median', 'max', 'min']
			});
			statister.getAll(elements, function(err, stats) {
				assert.equal(8, Object.keys(stats).length);

				assert.equal(elements.length, stats.count);
				assert.equal(7.3374999999999995, stats.mean);
				assert.equal(6.25, stats.median);
				assert.equal(12, stats.max);
				assert.equal(5, stats.min);

				assert.equal(8.333333333333334, stats.mean_60);
				assert.equal(6.3, stats.upper_60);
				assert.equal(6.2, stats.lower_60);

				done();
			});
		});

		it('90 and 60', function(done) {
			var statister = new Statister({
				percentiles: [0.9 ,0.6],
				metrics: ['mean', 'count', 'median', 'max', 'min']
			});
			statister.getAll(elements, function(err, stats) {
				assert.equal(11, Object.keys(stats).length);

				assert.equal(elements.length, stats.count);
				assert.equal(7.3374999999999995, stats.mean);
				assert.equal(6.25, stats.median);
				assert.equal(12, stats.max);
				assert.equal(5, stats.min);

				assert.equal(7.723076923076923, stats.mean_90);
				assert.equal(11, stats.upper_90);
				assert.equal(6, stats.lower_90);

				assert.equal(8.333333333333334, stats.mean_60);
				assert.equal(6.3, stats.upper_60);
				assert.equal(6.2, stats.lower_60);

				done();
			});
		});

		it('empty', function(done) {
			var expected = {
				count: 0,
				min: undefined,
				max: undefined,
				mean: undefined,
				median: undefined
			};

			var statister = new Statister({
				percentiles: [0.9, 0.6],
				metrics: ['mean', 'count', 'median', 'max', 'min']
			});
			statister.getAll([], function(err, stats) {
				assert.deepEqual(expected, stats);

				done();
			});
		});
	});

	describe('performance', function() {
		before(function() {
			this.statister = new Statister({
				percentiles: [0.9, 0.6],
				metrics: ['mean', 'count', 'median', 'max', 'min']
			});
		});

		it('200', function(done) {
			var elements = getRandom(200);

			var startTime = process.hrtime();
			this.statister.getAll(elements, function() {
				var diffTime = process.hrtime(startTime);

				assert.equal(0, diffTime[0]);
				assert.equal(true, diffTime[1] < 2300000);

				done();
			});
		});

		it('2000', function(done) {
			var elements = getRandom(2000);

			var startTime = process.hrtime();
			this.statister.getAll(elements, function() {
				var diffTime = process.hrtime(startTime);

				assert.equal(0, diffTime[0]);
				assert.equal(true, diffTime[1] < 10000000);

				done();
			});
		});

		it('20000', function(done) {
			var elements = getRandom(20000);

			var startTime = process.hrtime();
			this.statister.getAll(elements, function() {
				var diffTime = process.hrtime(startTime);

				assert.equal(0, diffTime[0]);
				assert.equal(true, diffTime[1] < 30000000);

				done();
			});
		});

		it('200000', function(done) {
			var elements = getRandom(200000);

			var startTime = process.hrtime();
			this.statister.getAll(elements, function() {
				var diffTime = process.hrtime(startTime);

				assert.equal(0, diffTime[0]);
				assert.equal(true, diffTime[1] < 300000000);

				done();

			});
		});

		xit('echo', function() {
			var elements = getRandom(20000);

			var startTime = process.hrtime();
			this.statister.getAll(elements, function(err, stats) {	
				console.log(stats);

				console.log(process.hrtime(startTime)[1]);
			});
		});
	});
});