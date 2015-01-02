var fs = require('fs');
var _ = require('lodash');
var cheerio = require('cheerio');
var request = require('request');


var scrape = function(year, top, cb) {

  // check inputs
  if (!_.contains([10, 25, 100], top)) {
    console.warn('top must either be 10, 25 or 100!');
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
      var parse = function(arr) {
        /*
         * from ['1. Online Shopping', '34 897 548'] to
         * { 'term' 'Online Shopping', 'count': 34897548 }
         */
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
      
      // need different selectors, since top25 / top100 is only from 11 / 26 to 25 / 100 ...
      var sel;
      if (top == 10)
        sel = 'tbody > tr[class="top10"]';
      if (top == 25)
        sel = 'tbody > tr[class="top10"], tbody > tr[class="top25"]';
      if (top == 100)
        sel = 'tbody > tr[class="top10"], tbody > tr[class="top25"], tbody > tr[class="top100"]';

      var languages = _.map($('h2 > a'), getname);
      var data = _.map($(sel), getdata);

      // construct the JSON representation
      var trends = _.reduce(languages, function(base, lang, i) {
        base[lang] = _.reduce(_.range(1, top + 1), function(b, place) {
          b[place] = parse(data[place - 1]);
          return b;
        }, {});

        return base;
      }, {});

      return cb(null, trends, year, top);
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

scrape(2014, 100, write); // write the top100 of year 2014 to disk
