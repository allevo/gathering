# README

[![Build Status](https://travis-ci.org/allevo/gathering.svg)](https://travis-ci.org/allevo/gathering)
[![NPM](https://nodei.co/npm/gathering-daemon.png)](https://nodei.co/npm/gathering-daemon/)


This is a daemon written in nodejs. It accepts UDP package, stores temporary the data, creates statistics and sends them to some backends.


## How to send a metric
The protocol for sending data to this daemon is very simple. The UDP package has the following syntax:
```
<package name>:<number>|<identifier>
```
where `<package name>` is the name of the event, `<number>` is the metric, `<identifier>` is the type of metric. To know which metrics is supported, see Metric types section.

You can send a UDP package specifing with a lot of metric in the same time. To do this, your metrics must be separated with EOL `\n`. For instance:
```
packagename:1|c\npackagename2:3.4444|ms
```

All characters are admitted for package name except EOL `\n`, the pipe `|` and the colon `:`. You can use all UTF8 characters.


## Metric types
There are different kinds of metrics. The most important are the following:
 * *count* to count how many events are fired
 * *time* to track the ellapsed time of a process
 * *set* to track a list of unique values
 * *gauge* to track a value edited by delta

### Count metric
The statistics of this metrics are the following:
 * *sum* is the arithmetic sum of the count.
 * *count* is the number of UDP packages arrives.

The identifier of this metric is 'c'.

### Time metric
This metric represents an ellapsed time for a process (i.e. http api call, db request). For this reason, this metric collects a lot of type of statistics:
 * *count* is the number of metrics the daemon received
 * *sum* is the arithmetic sum
 * *min* is the minium value
 * *max* is the maxium value
 * *median* is the median of the values
 * *mean* is the mean of the values

The identifier of this metric is 'ms'.

For each precentile described in you configuration (see Configuration section below):
 * *max* is the minium value in the percentile
 * *min* is the maxium value in the percentile
 * *mean* is the mean value in the percentile

**Warning: please don't ask a lot of percentiles. This might have a performace impact**

### Set metric
This metric is a list of unique elements. For instance, you can use this to store a unique user login. This type hasn't statistics.
The value stored on backends depends on which backend you need: Graphite stores the length of the set only; ElasticSearch stores all values.

The identifier of this metric is 's'.

### Gauge metric
This metrics is a number that can be change over time. There're two way to do this.
 * *reset* the value sending a package with a non signed value (`22`, `33`)
 * *sum* a delta sending a package with a signed value (`+22`, `-33`)
On flushing, the calculated statistic is the result of those rules. After flushing the gauge is removed and is not passed to backends on next time if a new message didn't arrive.

The identifier of this metric is 'g'.


## Configuration
Your configuration describes which backends will be load. For each backend, it's possible to specify a different configuration avoiding name collisions.

Your configuration must have `flushInterval`, `port` and `host` key set. This is the minimal configuration.

Your configuration should be like this:
```
{
  "port": 8898,
  "host": "127.0.0.1",
  "flushInterval": 100,
  "backends": {
    "stdout1": {
      "path": "./backends/stdout",
      "date_function": "toLocaleDateString"
    },
    "stdout2": {
      "path": "./backends/stdout",
      "date_function": "toLocaleDateString"
    },
    "stdout3": {
      "path": "./backends/stdout",
      "date_function": "toLocaleDateString"
    }
  }
}
```

Each backend has its configuration. See the Backends configuration section.

### Percentile configuration
Valueting the `percentiles` key of your configuration, Gathering will calculate the correct *min*, *max* and *mean* for each percentiles you specify.

### OS Stats
Gathering is able to track os statistics. Using `osStats` key in your configuration, Gathering calculates all stats and send them to each backend under `os` key. The `osStats` key is valued to `"all"` or an array that contains all statistics you need. There's possibile to find all elements in `statister.js` file.


## Backends configuration
All backend configurations must have a `path` key. Its value must be a valid path. Relative paths are possible and are resolved with `index.js` file as root.

Multiple backends are admitted and multiple instance of the same backends too.
```
{
  ...
  "backends": {
    "stdout1": {
      "path": "./backends/stdout",
      "date_function": "toLocaleDateString"
    },
    "stdout2": {
      "path": "./backends/stdout",
      "date_function": "toISOString"
    },
    "stdout3": {
      "path": "./backends/stdout",
      "date_function": "toLocaleDateString"
    }
  }
}
```
In this example, Gathering daemon creates three stdout backends with three different configurations.

### Stdout
This backend prints to output all data.

The only one parameter this backend accept is `date_function`.
Its value must be a name of a function callable on a Javascript Date object. Referring to [this page](http://www.w3schools.com/jsref/jsref_obj_date.asp)
```
"stdout": {
  "path": "./backends/stdout",
  "date_function": "toLocaleDateString"
}
```

### Graphite
This backend sends the statistics to a graphite server.

Its configuration must have `server` and `basePath` keys. `server` value is an hash with `port` and `host` keys. `basePath` value must be a string used as prefix in graphite key.
```
"graphite": {
  "path": "./backends/graphite",
  "server": {
    "host": "graphitehost.com",
    "port": 666
  },
  "basePath": "basePath"
}
```

### ElasticSearch
This backend sends the statistics to an elasticsearch server.

Its configuration must have  `server` key. `server` value is an hash with `port` and `host` keys. For each statistics you would send to elasticsearch, the configuration should be contained an hash with `_index` and `_type` keys to speficy where document will be created.
```
"elasticsearch": {
  "path": "./backends/elasticsearch",
  "server": {
    "host": "localhost",
    "port": 9200
  },
  "timeOptions": {
    "_index": "stats",
    "_type": "time"
  },
  "countOptions": {
    "_index": "stats",
    "_type": "count"
  },
  "osOptions": {
    "_index": "stats",
    "_type": "os"
  },
  "setOptions": {
    "_index": "stats",
    "_type": "set"
  },
  "gaugeOptions": {
    "_index": "stats",
    "_type": "gauge"
  }
}
```
If the configuration omits some options, the associated statistics are not send.


## How it works
If you are looking for a way to create new backend, this is the correct section.

Before starting to write, you should be sure which is your interface for the UDP package name. For instance, you are monitoring some api performace. So your code is sending some UDP packages to this daemon. The key you are using to identify the current called url should be like the following:
```
POST!/this/is/my/url!userid
```
When you will send the stats, you can store them in your backend correctly splitting the event name using *!* as separator.

### The aggregator
The aggregator is the class that is called before the creation of the statistics. It aims to aggregate your events by name. The default key on which the aggregator aggregates, is the package name.

After this, the statistics will be created and each backends will be called.

### The backend
Each backend should be "derived" from Sender class. This is because the interface remains stable on possible future changes.

When you create a new backend, there're three methods to override:
 * *constructor* is used to store some configuration or setup something.
 * *send* is used to send the statistics to your backend.
 * *close* is used when the daemon is closing and you want tear down something.

Probably you are interested in send method. This is the most important method and is used to send the statistics to your backend. For example to ElasticSeach or Graphite.

The simpliest example is Stdout backend that prints all statistics to output. You should start from it.

The backend send menthod has three paramenters:
 * *data* is the aggregated data already analized by Gathering.
 * *flushTime* is the date when Gathering requests to each backend to send the stats.
 * *callback* is a function that should be called when you are sure that your backend stores the stats.

It's important you implement this menthod as async as possible to perform better when some messages arrive when your backend flushes.

You can pass an error to the callback. It'll be printed to stdout.


## TODO
 * Aggregator is changable from configuration.
 * ~~Add gauge~~
 * Choose which stats is calculated
 * Add TCP admin interface
 * ~~Implement Graphite backend~~
 * ~~Add os stats~~
 * ~~Implement ElasticSeach backend~~
 * Add debug flag
 * Completely StatsD compatible


## Why use Gathering daemon?
Before starting this project, I have tried to use StatsD project but I have found a lot of problems.

StatsD is a great project but is born to send the stats to Graphite. Other backends like ElasticSeach have some problems specially with naming or UTF8 support or not Graphite-like package name.

The StatsD code is very tricky. I'm trying to rewrite it and this project born.

The first idea is "The simple is better". So using simple patterns and simple tests I hope I write this project clearly.

## Would you mind to contribute?
All contributors are accepted. Each ideas are accepted and discussed in the correct way. All pull request are welcome.
