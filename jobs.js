// index.js
var http = require("http");
var url = require('url'); 
var util = require('util');
var et = require('elementtree');

var jobsArray = {  jobs: []  };

/*

 - parse querystring for parameters
 - choose dataUrl based on site. 
 - insert parames into dataUrl
 - make dataUrl request
 - normalize : standardize structure, remove unused fields, standardize field names
 - convert to JSON
 - return result to client

*/


function getjobs(request, response) {

// expected params: kw, postalcode, ver, locale

      // set timeout for server request object
      request.setTimeout(15000,function () {
        console.log('request timed out')
      });


      var queryData = url.parse(request.url,true).query; 
      var completedCalls = 0;

      // accomodate Android v1, which sends postalcode parameter
      var location = (typeof queryData["postalcode"] != 'undefined') ? queryData["postalcode"] : encodeURIComponent(queryData["location"]);
      var countryCode = (queryData["country"]) ? queryData["country"] : "US";
      var maxResults = (typeof queryData["max"] != 'undefined') ? queryData["max"] : 50;
      var ageResults = (typeof queryData["age"] != 'undefined') ? queryData["age"] : 14;
      var distance = (typeof queryData["distance"] != 'undefined') ? queryData["distance"] : 20;

      // CB expected radius = 5, 10, 20, 30, 50, 100, or 150
    
      jobsArray = {  jobs: []  };

      var dataUrl = new Array("http://api.indeed.com/ads/apisearch?publisher=4401016323531060&q=" + queryData["kw"] + "&l=" + location + "&sort=&radius=" + distance + "&st=&jt=&start=&limit=" + maxResults + "&fromage=" + ageResults + "&filter=&latlong=0&co=" + countryCode + "&chnl=&userip=97.74.215.83&useragent=safari&v=2",
        "http://api.careerbuilder.com/v1/jobsearch?DeveloperKey=WD1B7QV6MZZXBTC2CT7K&Keywords=" + queryData["kw"]  + "&Location=" + location + "&PostedWithin=" + ageResults  + "&OrderBy=&PerPage=" + maxResults + "&Radius=" + distance + "&CountryCode=" + countryCode,
        "http://www.linkup.com/developers/v-1/search-handler.js?api_key=131a8858030d3b157cdb5221648eb155&embedded_search_key=0712dee93e7e15ba5a2c52c1c25de159&orig_ip=97.74.215.83&keyword=" + queryData["kw"]  + "&location=" + location + "&distance=10&sort=d",
        "http://api.oodle.com/api/v2/listings?key=BE3A6CD6445D&region=usa&location=" + location + "&category=job&q=" + queryData["kw"]  + "&sort=ctime_reverse&num=50" 
);


  var nFeeds = (countryCode == "US") ? dataUrl.length : 2; // if not US, use only Indeed & CareerBuilder
    console.log("# of feeds = " + nFeeds);

  var feedReqCompleted = function() {
    completedCalls++;
    // called on completion of each API request
    if (completedCalls == nFeeds) {
      response.writeHead(200, {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=120',
        'Last-Modified': (new Date()).toUTCString()
      });

      response.write(JSON.stringify(jobsArray), false, null);
      response.end();

    }

  }   


  for (i=0; i < nFeeds; i++) {

    console.log("feed = " + dataUrl[i]);
    var feedReq = http.get(dataUrl[i], function(res) {   

      var xmlStr = '';

      res.on("data", function(chunk) {
        xmlStr += chunk;
      });

      res.on('end', function() {
        var tmpArray = parseXml(xmlStr);
        feedReqCompleted();
      });

    }); // end http.get

    feedReq.setTimeout( 5000, function( ) {
      console.log("feed timeout ");
          // error handling for non-responsive feeds
          feedReq.abort();
          feedReqCompleted();
    });

    feedReq.on("error", function(err) {
        console.log("Error connecting = ", err);
      });

  }



} // end getJobs function


function parseXml(xmlStr) {

  var etree = et.parse(xmlStr);
  var jobsPath = null;
  var isOodle = 0;
  var jobsXml = { };

  // determine data source
  var jobNodePath = new Array("./results/result/", "./Results/JobSearchResult/", "./jobs/job/", "./listings/element/" );
  for (i = 0; i<jobNodePath.length; i++) {
    if (etree.findall(jobNodePath[i]).length > 0 ) {
      jobsPath = jobNodePath[i];
      break;
    }

  }

  if (jobsPath) {
    var isOodle = (jobsPath.indexOf("element") > -1);
    var jobsXml = etree.findall(jobsPath); 
  }


  var tags = [ "title", "company", "description", "location", "pubdate", "link"];
  var tagsTitle = ["job_title", "jobtitle", "JobTitle" ];
  var tagsDescription = ["snippet", "DescriptionTeaser", "body", "job_description" ];
  var tagsLocation = ["job_location", "formattedLocation", "Location" ];
  var tagsCompany = ["company", "job_company", "Company" ];
  var tagsUrl = ["JobDetailsURL", "job_title_link", "url" ];  
  var tagsPubdate = ["date", "PostedDate", "job_date_added" ];
  var tagsType = ["EmploymentType", "employee_type" ];

  

//  for (i=0; i<2; i++) { // for each job. limit for testing
  for (i=0;i<jobsXml.length;i++) { // for each job
    var o = jobsXml[i]._children;
    var tmpJob = {};
    for (var node in o) {           // for each job attribute
        var item = o[node];

        if (tagsTitle.indexOf(item.tag) > -1) { tmpJob.title = item.text; }
        if (tagsLocation.indexOf(item.tag) > -1) { tmpJob.location = item.text; }
        if (tagsCompany.indexOf(item.tag) > -1) { tmpJob.company = item.text; }
        if (tagsDescription.indexOf(item.tag) > -1) { tmpJob.description = item.text; }
        if (tagsUrl.indexOf(item.tag) > -1) { tmpJob.link = item.text; }
        if (tagsPubdate.indexOf(item.tag) > -1) { tmpJob.pubdate = new Date(item.text).toISOString(); }
        if (tagsType.indexOf(item.tag) > -1) { tmpJob.type = item.text; }

        if (item.tag == "attributes" && isOodle) {
          var oc = item._children;
          for (var node in oc) {           // for each attribute node
            if (oc[node].tag == "job_title") { tmpJob.title = oc[node].text; }
            if (oc[node].tag == "company") { tmpJob.company = oc[node].text; }
          }

        } 
        if (item.tag == "location" && isOodle) {
            tmpJob.location = item._children[0].text;
        }
        if (item.tag == "ctime") { 
            tmpJob.pubdate = new Date(item.text*1000);
        }
    }

    jobsArray.jobs.push({ 
        "title" : tmpJob.title,
        "company"  : tmpJob.company,
        "description" : tmpJob.description,
        "location" : tmpJob.location,
        "link" : tmpJob.link,
        "pubdate" : tmpJob.pubdate,
        "type" : tmpJob.type
    });

  }

    return jobsArray;

}

exports.getjobs = getjobs;



	function show_404(request, response) {

  response.writeHead(404, {'Content-Type': 'text/plain'});
  response.write('404 - Please try again.');
  response.end();
}