'use strict'

const client = require('https'); 
const NodeCache = require( "node-cache" );

const cache = new NodeCache({ stdTTL: 10000});
const campusCodes = {"scc":"062"}
// yrq: B781 = summer, B782 = fall

const options = {
    hostname: 'mycentral.seattlecolleges.edu',
    path: '/WebServices/MobileSchedule.asmx/GetDepartmentDetails',
    port: 443,
    method: 'POST',
    headers: {
       'Content-Type': 'application/json; charset=UTF-8',
       'Connection':'keep-alive'
     }
};

exports.classes = (campus, dept, yrq, callback) => {
    const cacheKey = campus + "_" + dept + "_" + yrq;
    try {
        let result = cache.get( cacheKey, true );
        if (result) {
            callback(result);
        }
    } catch ( err ) {
        let detail = {campusCode: campusCodes[campus], yrq: yrq, deptId:dept, "deptName":"", "openClassesOnly":"false", "filterOpts":{}};
        loadUrl(detail, options).then((values) => {
            let json = JSON.parse(values);
            cache.set( cacheKey, json, (err,success) => {
                if (err) {
                    console.log("err - " + err);
                }
            });
            callback(json);
        }).catch((err) => {
            callback(err);
        });
    }
}

const loadUrl = (reqBody, options) => {
  return new Promise((resolve, reject) => {
    const request = client.request(options, (response) => {
      // handle http errors
      if (response.statusCode < 200 || response.statusCode > 299) {
        reject({"error": response.statusCode});
       } 
      // temporary data holder
      const body = [];
      response.on('data', (chunk) => body.push(chunk));
      response.on('end', () => resolve(body.join('')));
    });
    request.write(JSON.stringify(reqBody));
    request.end();
    // handle connection errors of the request
    request.on('error', (err) => {
        reject(err)
    });
  });
};
