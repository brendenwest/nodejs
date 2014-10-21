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

      var dataUrl = new Array("http://api.indeed.com/ads/apisearch?publisher=4401016323531060&q=" + queryData["kw"] + "&l=" + location + "&sort=date&radius=" + distance + "&st=&jt=&start=&limit=" + maxResults + "&fromage=" + ageResults + "&filter=&latlong=0&co=" + countryCode + "&chnl=&userip=97.74.215.83&useragent=safari&v=2",
        "http://api.careerbuilder.com/v1/jobsearch?DeveloperKey=WD1B7QV6MZZXBTC2CT7K&Keywords=" + queryData["kw"]  + "&Location=" + location + "&PostedWithin=" + ageResults  + "&OrderBy=Date&PerPage=" + maxResults + "&Radius=" + distance + "&CountryCode=" + countryCode,
        "http://api.oodle.com/api/v2/listings?key=BE3A6CD6445D&region=usa&location=" + location + "&category=job&q=" + queryData["kw"]  + "&sort=ctime_reverse&num=50"
      );

/*      var dataUrl = new Array("http://api.indeed.com/ads/apisearch?publisher=4401016323531060&q=" + queryData["kw"] + "&l=" + location + "&sort=date&radius=" + distance + "&st=&jt=&start=&limit=" + maxResults + "&fromage=" + ageResults + "&filter=&latlong=0&co=" + countryCode + "&chnl=&userip=97.74.215.83&useragent=safari&v=2",
        "http://api.careerbuilder.com/v1/jobsearch?DeveloperKey=WD1B7QV6MZZXBTC2CT7K&Keywords=" + queryData["kw"]  + "&Location=" + location + "&PostedWithin=" + ageResults  + "&OrderBy=Date&PerPage=" + maxResults + "&Radius=" + distance + "&CountryCode=" + countryCode,
        "http://www.linkup.com/developers/v-1/search-handler.js?api_key=131a8858030d3b157cdb5221648eb155&embedded_search_key=0712dee93e7e15ba5a2c52c1c25de159&orig_ip=97.74.215.83&keyword=" + queryData["kw"]  + "&location=" + location + "&distance=10&sort=d",
        "http://api.oodle.com/api/v2/listings?key=BE3A6CD6445D&region=usa&location=" + location + "&category=job&q=" + queryData["kw"]  + "&sort=ctime_reverse&num=50" 
);
*/

  var nFeeds = (countryCode == "US") ? dataUrl.length : 2; // if not US, use only Indeed & CareerBuilder
    console.log("feeds = " + nFeeds);

  for (i=0; i < nFeeds; i++) {

/*
request.get({url: url}, function(err, resp, body){
  if(err) return res.end(err.message);
  res.send(body);
}).on('error', function(e){
    console.log(e)
  }).end()
*/

    console.log("feed = " + dataUrl[i]);
    http.get(dataUrl[i], function(res) {   

      var xmlStr = '';

      res.setTimeout(0);
      res.on("data", function(chunk) {
        xmlStr += chunk;
      });
/*
      res.on('socket', function (socket) {
        socket.setTimeout(20);  
        socket.on('timeout', function() {
            res.abort();
        });
      });
      res.on("error", function(chunk) {
        var tmpArray = "";
        completedCalls++;
      });
*/
      res.on('end', function() {
        var tmpArray = parseXml(xmlStr);
        completedCalls++;
        if (completedCalls == nFeeds) {

          response.writeHead(200, {'Content-Type': 'application/json'});
          response.write(JSON.stringify(jobsArray), false, null);
          response.end();

        }
      });

    }); // end http.get
  }


}



function parseXml(xmlStr) {

    // test string   var
  //xmlStr = '<response version="2"><query>paralegal</query><location>98104</location><dupefilter>true</dupefilter><highlight>false</highlight><totalresults>61</totalresults><start>1</start><end>25</end><radius>25</radius><pageNumber>0</pageNumber><results><result><jobtitle>Corporate/Counsel/In House/Seattle,Washington</jobtitle><company>GCC Consulting</company><city>Seattle</city><state>WA</state><country>US</country><formattedLocation>Seattle,WA</formattedLocation><source>GCC Consulting</source><date>Tue, 13 May 201409:04:11 GMT</date><description>practice and administration matters, suchimplementing training program for paralegals and new attorneys, annual clientsurveys, and other team metrics. The...</description><url>http://www.indeed.com/viewjob?jk=f7bd5ad7098b9bcb&amp;qd=41wYnfEuZAzqtw4AN0trG0MwsyoXiYtls9jSaktjXVnb32BU9xz9_SBF85nr8MmGFX2bCe0DeqLuKBSOdX32EAhwVjAqoiduF3DCrS4J2Pg40X9RqMmoWy146cYiCabl&amp;indpubnum=4401016323531060&amp;atk=18nr30vqa1d624ie</url><onmousedown>indeed_clk(this,"4610");</onmousedown><jobkey>f7bd5ad7098b9bcb</jobkey><sponsored>false</sponsored><expired>false</expired><formattedLocationFull>Seattle,WA</formattedLocationFull><formattedRelativeTime>6 hoursago</formattedRelativeTime></result><result><jobtitle>StaffAttorney</jobtitle><company>Catholic Community Services of Western Washington</company><city>Seattle</city><state>WA</state><country>US</country><formattedLocation>Seattle, WA</formattedLocation><source>idealist.org</source><date>Tue, 13May 2014 06:16:10 GMT</date><description>case evaluated. Then they may bescheduled for an appointment. Attorneys and paralegals provide free legalassistance ranging from self-help information to...</description><url>http://www.indeed.com/viewjob?jk=33dbc73afa28c8c4&amp;qd=41wYnfEuZAzqtw4AN0trG0MwsyoXiYtls9jSaktjXVnb32BU9xz9_SBF85nr8MmGFX2bCe0DeqLuKBSOdX32EAhwVjAqoiduF3DCrS4J2Pg40X9RqMmoWy146cYiCabl&amp;indpubnum=4401016323531060&amp;atk=18nr30vqa1d624ie</url><onmousedown>indeed_clk(this, \'4610\');</onmousedown><jobkey>33dbc73afa28c8c4</jobkey><sponsored>false</sponsored><expired>false</expired><formattedLocationFull>Seattle,WA</formattedLocationFull><formattedRelativeTime>9 hoursago</formattedRelativeTime></result></results></response>';

  //      response.write(xmlStr);
  //      response.end();

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