/* jshint camelcase: false */
'use strict';

var os = require('os');

var map = require('./async').map;

function Statister(config) {
  this.config = config;
  var osStats = this.config.osStats || [];
  if (osStats === 'all') {
    osStats = ['hostname', 'uptime', 'freemem', 'totalmem', 'loadavg', 'cpus'];
  }
  this.config.osStats = osStats.reduce(function(o, v) {
    o[v] = v;
    return o;
  }, {});
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

Statister.prototype.getOSStats = function(callback) {
  map(this.config.osStats, function(item, next) {
    if (item in os) {
      return next(null, os[item]());
    }
    next(new Error(item + 'isn\'t a property of os package'));
  }, function(err, ret) {
    if (ret.loadavg) {
      ret.loadavg_1 = ret.loadavg[0];
      ret.loadavg_5 = ret.loadavg[1];
      ret.loadavg_15 = ret.loadavg[2];
      delete ret.loadavg;
    }
    if (ret.cpus) {
      for(var k =0; k < ret.cpus.length; k++) {
        ret['cpus' + k] = {
          user: ret.cpus[k].times.user,
          nice: ret.cpus[k].times.nice,
          sys: ret.cpus[k].times.sys,
          idle: ret.cpus[k].times.idle,
          irq: ret.cpus[k].times.irq,
        };

      }
      delete ret.cpus;
    }

    callback(err, ret);
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

Statister.prototype.getSetStats = function(data, callback) {
  if (!data || !data.length) {
    return callback(null, null);
  }
  var res = data.reduce(function(prev, current) { prev[current.value] = true; return prev; }, {});
  callback(null, Object.keys(res));
};

Statister.prototype.getGaugeStats = function(data, callback) {
  var tot = 0;
  var convertedNumber, firstChar;
  for(var i = data.length - 1; i >= 0; i--) {
    convertedNumber = Number(data[i].value);
    if (isNaN(convertedNumber)) {
      return callback(new Error('Invalid stats for gauge: ' + data[i]));
    }
    tot += convertedNumber;
    firstChar = data[i].value.slice(0, 1);
    if (firstChar !== '+' && firstChar !== '-') {
      break;
    }
  }
  callback(null, tot);
};

module.exports = Statister;
