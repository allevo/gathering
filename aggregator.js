'use strict';

function Aggregator() {
}

Aggregator.prototype.aggregate = function(data, callback) {
	var aggregated = {};
	for(var type in data) {
		var values = data[type];
		aggregated[type] = {};
		for(var i in values) {
			var key = this.getKey(values[i]);
			aggregated[type][key] = aggregated[type][key] || [];
			aggregated[type][key].push(values[i]);
		}
	}
	return callback(null, aggregated);
};

Aggregator.prototype.getKey = function(item) {
	return item.name;
};


module.exports = Aggregator;
