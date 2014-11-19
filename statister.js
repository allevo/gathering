'use strict';

var map = require('./async').map;

function Statister(config) {
	this.config = config
}

Statister.prototype.getAll = function(data, callback) {
	var count = data.length;
	if (count  === 0) {
		return callback(null, {
			count: 0,
			min: undefined,
			max: undefined,
			mean: undefined,
			median: undefined
		});
	}
	var min = data[0].value;
	var max = data[0].value;
	var sum = 0;

	for(var i in data) {
		sum += data[i].value;
		if (min > data[i].value) {
			min = data[i].value;
		} else if (max < data[i].value) {
			max = data[i].value;
		}
	}

	var sorted = data.sort(function (a, b) { return a.value - b.value; });
	var median = 0;
	if (count % 2 === 1) {
		median = sorted[(count - 1) / 2].value;
	} else {
		var a = sorted[(count / 2) - 1].value;
		var b = sorted[(count / 2)].value;
		median = (a + b) / 2;
	}

	var ret = {
		count: count,
		min: min,
		max: max,
		mean: sum / count,
		median: median
	};

	map(this.config.percentiles, function(percentile, next) {
		var sPercentile = Math.floor(percentile * 100);
		var count_p = Math.floor(count * percentile) - Math.floor(count * (1 - percentile))
		
		ret['upper_' + sPercentile] = sorted[Math.floor(count * percentile)].value;
		ret['lower_' + sPercentile] = sorted[Math.floor(count * (1 - percentile))].value;
		ret['mean_' + sPercentile] = sorted.slice(Math.floor(count * (1 - percentile)), Math.floor(count * percentile) + 1)
			.reduce(function(prev, current) { return prev + current.value; }, 0) / count_p;

		next();
	}, callback.bind(null, null, ret));
}

module.exports = Statister;
