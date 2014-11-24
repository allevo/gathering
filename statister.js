'use strict';

var map = require('./async').map;

function Statister(config) {
  this.config = config;
}

Statister.prototype.getCountStats = function(data, callback) {
  if (!data || !data.length) {
    return callback(null, null);
  }

  return callback(null, {
    count: data.length,
    sum: data.reduce(function(s, item) { return s + item.value; }, 0),
  });
};

Statister.prototype.getTimeStats = function(data, callback) {
  if (!data || !data.length) {
    return callback(null, null);
  }
  var count = data.length;

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
    var count_p = Math.floor(count * percentile) - Math.floor(count * (1 - percentile)) + 1;
    
    ret['count_' + sPercentile] = count_p;
    ret['max_' + sPercentile] = sorted[Math.floor(count * percentile)].value;
    ret['min_' + sPercentile] = sorted[Math.floor(count * (1 - percentile))].value;
    ret['mean_' + sPercentile] = sorted.slice(Math.floor(count * (1 - percentile)), Math.floor(count * percentile) + 1)
      .reduce(function(prev, current) { return prev + current.value; }, 0) / count_p;

    next();
  }, callback.bind(null, null, ret));
};

module.exports = Statister;
