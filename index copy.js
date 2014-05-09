var server = require("./server");
var request = require('request');
var url = process.argv[2];

server.start();


request('http://news.google.com/news?pz=1&cf=all&ned=us&hl=en&output=rss', function (error, response, body) {
  if (!error && response.statusCode == 200) {
	  var parseString = require('xml2js').parseString;
	//  var xml = "<root>Hello xml2js!</root>"
	  parseString(response, function (err, result) {
	      console.dir(result);
	  });
  }
})
