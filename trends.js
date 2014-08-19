// index.js
var request = require('request');
var url = require('url'); 
var cheerio = require('cheerio');


function getsalaries(req, response) {
    var queryData = url.parse(req.url,true).query; 
    var titles = [];
    var jobsArray = [];

    var location = (queryData["location"]) ? '-l-' +queryData["loc"] : '';

    var dataUrl = 'http://www.simplyhired.com/salaries-k-' +queryData["kw"] +location+ '-jobs.html';
//    http://www.simplyhired.com/salaries-k-php-l-98115-jobs.html
    request(dataUrl, (function() {
      return function(err, resp, body) {
        if (err)
            throw err;
        $ = cheerio.load(body);
        // get job titles
        $(' .SH_job_title').each(function() {
            titles.push($(this).text());
        });
        i=0;
        // get job salaries
        $(' .SH_salary').each(function() {
            jobsArray.push({
                "title" : titles[i],
                "salary" : $(this).text()
             });

            i++;
        }); 
        jobsArray.push({ "updated" : $(' .SH_bar_graph_footer').first().text() });
        jobsArray.push({ "timestamp" : new Date() });

          response.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});

          response.write(JSON.stringify(jobsArray), false, null);
          response.end();
      }}) ());
}


exports.getsalaries = getsalaries;


// SH_bar_graph_footer, SH_job_title, SH_salary


