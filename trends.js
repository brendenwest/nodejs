// index.js
var request = require('request');
var url = require('url'); 
var cheerio = require('cheerio');


function getsalaries(req, response) {
    var queryData = url.parse(req.url,true).query; 
    var titles = [];
    var jobsArray = [];

    var location = queryData["location"];

/*

<tr class="row_1">
                                        
                                        <td class="col_a"><h2><a href="/q-Lead-Android-Developer-jobs.html" class="job_title">Lead Android Developer</a></h2></td>
                    <td class="col_b"><span class="salary">$108,000</span></td>
                    <td class="col_c" colspan="3"><div class="bar query_1" style="width: 80%;"></div></td>
                    <!-- td class="col_e"><span class="sampleSize">330</span></td -->
                  </tr>
*/

    var dataUrl = 'http://www.indeed.com/salary?q1=' + queryData["kw"] + '&l1=' +queryData["location"];
    request(dataUrl, (function() {
      return function(err, resp, body) {
        if (err)
            throw err;
        $ = cheerio.load(body);
        // get job titles
        $(' .job_title').each(function() {
            var title = $(this).text();
            if (location) {
              title = title.substring(0,title.indexOf(" in"));
            }
            titles.push(title);
        });
        i=0;
        // get job salaries
        $(' .salary').each(function() {
            jobsArray.push({
                "title" : titles[i],
                "salary" : $(this).text()
             });

            i++;
        }); 
        jobsArray.push({ "updated" : $('#salary_display_table tfoot tr th:nth-child(1) span').text() });
        jobsArray.push({ "timestamp" : new Date() });

          response.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});

          response.write(JSON.stringify(jobsArray), false, null);

          response.end();
      }}) ());
}


exports.getsalaries = getsalaries;


// SH_bar_graph_footer, SH_job_title, SH_salary


