'use strict';


function mapObject(obj, iter, callback) {
	var objCount = Object.keys(obj).length;
	if (objCount === 0) {
		callback(null, {});
	}

	var tasks = [];
	var ret = {};
	for(var key in obj) {
		var item = obj[key];
		tasks.push({
			func: iter.bind(null, item),
			key: key
		});
	}

	var count = 0;
	tasks.forEach(function(element) {
		element.func(function(err, res) {
			ret[element.key] = res;
			count ++;
			if (count === objCount) {
				callback(null, ret);
			}
		});
	});
}

function mapArray(arr, iter, callback) {
	var arrCount = arr.length;
	if (arrCount === 0) {
		callback(null, []);
	}

	var tasks = [];
	var ret = [];
	for(var key in arr) {
		var item = arr[key];
		tasks.push({
			func: iter.bind(null, item),
			key: key
		});
	}

	var count = 0;
	tasks.forEach(function(element) {
		element.func(function(err, res) {
			ret[element.key] = res;
			count ++;
			if (count === arrCount) {
				callback(null, ret);
			}
		});
	});
}

function map(obj, iter, callback) {
	if (Array.isArray(obj)) {
		mapArray(obj, iter, callback);
	} else {
		mapObject(obj, iter, callback);
	}
}

function parallel(obj, callback) {
  var tasks = {};
  for(var i in obj) {
    tasks[i] = obj[i];
  }
  map(tasks, function(item, next) { item(next); }, callback);
}


module.exports.map = map;
module.exports.parallel = parallel;
