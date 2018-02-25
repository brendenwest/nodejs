'use strict'

let http = require("http");
let url = require('url');
let et = require('elementtree');
let Joi = require("joi");

const schema = Joi.object().keys({
    kw: Joi.string().required(),
    postalcode: Joi.string(),
    location: Joi.string(),
    country: Joi.string().default('US'),
    max: Joi.number().default(50),
    age: Joi.number().default(14),
    distance: Joi.number().default(20)
});


/*

 - parse querystring for parameters
 - choose dataUrl based on site. 
 - insert params into dataUrl
 - make dataUrl request
 - normalize : standardize structure, remove unused fields, standardize field names
 - convert to JSON
 - return result to client

*/

exports.getjobs = (requestUrl, callback) => {
    let queryData = url.parse(requestUrl,true).query;
    const values = Joi.validate(queryData, schema).value;
    let location = (values.postalcode) ? values.postalcode : encodeURIComponent(values.location);

    // CB expected radius = 5, 10, 20, 30, 50, 100, or 150
  
    let jobs = [];

    let dataUrls = [
      "https://api.indeed.com/ads/apisearch?publisher=4401016323531060&q=" + values.kw + "&l=" + location + "&sort=&radius=" + values.distance + "&st=&jt=&start=&limit=" + values.max + "&fromage=" + values.age + "&filter=&latlong=0&co=" + values.country + "&chnl=&userip=97.74.215.83&useragent=safari&v=2",
      "https://api.careerbuilder.com/v1/jobsearch?DeveloperKey=WD1B7QV6MZZXBTC2CT7K&Keywords=" + values.kw  + "&Location=" + location + "&PostedWithin=" + values.age  + "&OrderBy=&PerPage=" + values.max + "&Radius=" + values.distance + "&CountryCode=" + values.country,
      "https://www.linkup.com/developers/v-1/search-handler.js?api_key=131a8858030d3b157cdb5221648eb155&embedded_search_key=0712dee93e7e15ba5a2c52c1c25de159&orig_ip=97.74.215.83&keyword=" + values.kw  + "&location=" + location + "&distance=10&sort=d",
      "https://api.oodle.com/api/v2/listings?key=BE3A6CD6445D&region=usa&location=" + location + "&category=job&q=" + values.kw  + "&sort=ctime_reverse&num=" + values.max 
      ];

  let feeds = dataUrls.filter((url,index) => {
    return values.country == "US" || index < 2;
  });

  Promise.all(feeds.map(loadUrl))
  .then((values) => {
    values.forEach((xmlStr) => {
      let result = parseXml(xmlStr);
      jobs = jobs.concat(result)      
    });
    
    callback(jobs);

  })
  .catch((err) => {
    console.log(err);
  });

} // end getJobs function

const loadUrl = (url) => {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? require('https') : require('http');
    const request = lib.get(url, (response) => {
      // handle http errors
      if (response.statusCode < 200 || response.statusCode > 299) {
         reject(new Error('Failed to load page, status code: ' + response.statusCode));
       }
      // temporary data holder
      const body = [];
      response.on('data', (chunk) => body.push(chunk));
      response.on('end', () => resolve(body.join('')));
    });
    // handle connection errors of the request
    request.on('error', (err) => reject(err));
    });
};

const parseXml = (xmlStr) => {

    let etree = et.parse(xmlStr);
    var jobsPath = null;
    var isOodle = 0;
    var jobsXml = { };
    let json = [];

    // determine data source
    var jobNodePath = new Array("./results/result/", "./Results/JobSearchResult/", "./jobs/job/", "./listings/element/" );
    for (var i = 0; i<jobNodePath.length; i++) {
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
  
    for (var i=0;i<jobsXml.length;i++) { // for each job
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
      json.push({ 
          "title" : tmpJob.title,
          "company"  : tmpJob.company,
          "description" : tmpJob.description,
          "location" : tmpJob.location,
          "link" : tmpJob.link,
          "pubdate" : tmpJob.pubdate,
          "type" : tmpJob.type
      });
  
    }
    return json;
};


	function show_404(request, response) {

  response.writeHead(404, {'Content-Type': 'text/plain'});
  response.write('404 - Please try again.');
  response.end();
}