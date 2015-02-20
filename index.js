var fs = require('fs');
var _ = require('lodash');
var async = require('async');
var cheerio = require('cheerio');
var request = require('request');


var wikiscrape = function(year, top, cb) {

  // check inputs
  if (!_.contains([10, 25, 100], top)) {
    console.warn('top must either be an *integer* of value 10, 25 or 100!');
    return;
  }

  if (_.parseInt(year, 10) < 2012) {
    console.warn('There is no data for {year}.'.replace('{year}', year));
    console.log('There is only data for the years since 2012.');
    return;
  }
  //

  var opts = {
    url: ['https://tools.wmflabs.org/wikitrends', year + '.html'].join('/'),
    headers: {
      'User-Agent': 'request'
    }
  };

  request.get(opts, function(err, res, body) {
      if (err) return cb(err);
      var $ = cheerio.load(body);

      // functions for _.map
      var parse = function(arr) {
        // ['1. Online Shopping', '34 897 548'] =>
        // {'term': 'Online Shopping', 'count': 34897548 }
        return {
          'term': _.first(arr).substr(3).trim(),
          'count': _.parseInt(_.last(arr).replace(/\s+/g, ''), 10)
        };
      };

      var getname = function(e) { return $(e).attr('name'); };
      var getdata = function(e) { 
        return _.map($(e).children(), function(child) {
          return $(child).text();
        });
      };
      //
      
      // need different selectors, since top25 / top100 is only from 11 / 26 to 25 / 100 ...
      var sel;
      if (top == 10)
        sel = 'tbody > tr[class="top10"]';
      if (top == 25)
        sel = 'tbody > tr[class="top10"], tbody > tr[class="top25"]';
      if (top == 100)
        sel = 'tbody > tr[class="top10"], tbody > tr[class="top25"], tbody > tr[class="top100"]';

      // ES6 arrow functions will make that sooooo much prettier
      var fn_lang = function(cb) { cb(null, _.map($('h2 > a'), getname)); };
      var fn_data = function(cb) { cb(null, _.map($(sel), getdata)); };

      // run the selections in parallel ~ slight speed increase, on average
      async.parallel([fn_lang, fn_data], function(err, results) {
          if (err) return cb(err);

          var data = _.last(results);
          var languages = _.first(results);

          // construct the JSON representation
          var trends = _.reduce(languages, function(base, lang, i) {

            base[lang] = _.reduce(_.range(1, top + 1), function(b, place) {
              b[place] = parse(data[place - 1 + i * top]);
              return b;
            }, {});

            return base;
          }, {});

          return cb(null, trends, year, top);
        });
    });
};


var write = function(err, data, year, top) {
  if (err) throw err;
  var name = ['wikitrends', year, top].join('-') + '.json';
  fs.writeFile(name, JSON.stringify(data, null, 4), function(err) {
    if (err) throw(err);
    console.log('written to ' + name);
  });
};

wikiscrape(2014, 100, write); // write the top100 of year 2014 to disk
