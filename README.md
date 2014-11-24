# README

[![Build Status](https://travis-ci.org/allevo/statistic-aggregator.svg)](https://travis-ci.org/allevo/statistic-aggregator)

This is a daemon written in nodejs. It accepts UPD package, stores temporary the data, creates statistics and sends them to some backends.

## How to send a metric
The protocol for sending data to this daemon si very simple. The UDP package has the following syntax:
```
<package name>:<number>|<identifier>
```
where <package name> is the name of the event, number is the metric, identifier is the type of metric. To know which metrics is supported, see Metric types section.
You can send a UPD package specifing with a lot of metric in the same time. To do this, your metrics must be separated with EOL '\n'. For instance:
```
packagename:1|c\npackagename2:3.4444|ms
```

## Metric types
There are different kinds of metrics. The most important are the following:
 * count to count how many events are fired
 * time to track the ellapsed time of a process

### Count metric
The statistics of this metrics are the following:
 * sum: this is the arithmetic sum of the count.
 * count: this is the number of UPD packages arrives.
 The identifier of this metric is 'c'.

### Time metric
This metric represents an ellapsed time for a process (i.e. http api call). For this reason, this metric collects a lot of type of statistics:
 * count: the number of metrics the daemon received
 * sum: the arithmetic sum
 * min: the minium value
 * max: the maxium value
 * median: the median of the values
 * mean: the mean of the values
And for each precentile described in you configuration (see Configuration section below):
 * max: the minium value in the percentile
 * min: the maxium value in the percentile
 * mean: the mean value in the percentile
 The identifier of this metric is 'ms'.

## Configuration
Your configuration describes which backends will be load. For each backend, it's possible to specify a different configuration avoiding name collisions.
When this daemon would send the statistics, it send them on each backend. Therefore, custom backend can be create easily.
Your configuration must have 'flushInterval', port' and 'host' key set. This is the minimal configuration. But... if you are using this, you should send the statistics to somewhere. So let's try to explain how to configure this daemon.

### Percentile configuration
Valueting the 'percentiles' key of your configuration, the daemon will calculate the correct min, max and mean for each percentiles you specify.

## How it works
If you are looking for a way to create new backend, this is the correct section.

Before starting to write, you should be sure which is your interface for the UPD package name. For instance, you are monitoring some api performace. So your code is sending some UPD packages to this daemon. The key you are using to identify the current called url should be like the following:
```
POST!/this/is/my/url!userid
```
When you will send the stats, you can store them in your backend correctly.

### The aggregator
The aggregator is the class that is called before the creation of the statistics. It aims to aggregate your events by name. The default key on which the aggregator aggregates, is the package name. (TODO: But this behaviour can be overrided rewriting Aggregator.getKey method. In the configuration, you can set the custom aggregator.)

After this, the statistics will be created and each backends will be called.

### The backend
Each backend should be "derived" from Sender class. This is because the interface remains stable on possible future changes.
When you create a new backend, there're three method to override:
 * constructor is used to store some configuration or setup something.
 * send is used to send the statistics to your backend.
 * close is used when the daemon is closing to tear down something.
Probably you are interested in send method. This is the most important method and is used to send the statistics to your backend. For example to ElasticSeach or Graphite.
An example is provided to Stdout backend that print all statistics to output.
The backend send menthod has three paramenters:
 * data is the aggregated data already analized by this daemon.
 * flushTime is the date when the daemon requests to each backend to send the stats.
 * callback is a function that should be called when you are sure that your backend stores the stats.
It's important you implement this menthod as async as possible to perform better when some messages arrive when your backend is flushing. You can pass an error to the callback. It'll be printed to stdout.


## TODO
 * Aggregator is changable from configuration.
 * Add gauge
 * Choose which stats is calculated
 * Implement Graphite backend
 * Implement ElasticSeach backend
 * Add debug flag

## Why don't use statsd
Before starting this project, I have tried to use StatsD project but finding a lot of problems. StatsD is a great project but is born to send the stats to Graphite. Other backends like ElasticSeach have some problems with naming or UTF8 support. The StatsD code is very ugly and complicated. I'm trying to rewrite it and this project born. The first idea is "The simple is better". So using simple patterns and simple tests I hope I write this project clearly.

## Whould you mind to contribute?
All contributors are accepted. Each ideas are accepted and discussed in the correct way. All pull request are welcome.
