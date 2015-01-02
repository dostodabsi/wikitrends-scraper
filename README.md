# wikitrends-scraper

You can use it to scrape data from [wikitrends](https://tools.wmflabs.org/wikitrends/2014.html) using [node](http://nodejs.org/).

```
git clone https://github.com/dostodabsi/wikitrends-scraper.git
cd wikitrends-scraper

npm install
node index.js
```

You can specify the year (>= 2012) and scrape either the top10, top25 or top100. Per default, it will download the top100 sites from the
year 2014 to *wikitrends-2014-100.json* in the current directory. You can easily adjust that, though.
