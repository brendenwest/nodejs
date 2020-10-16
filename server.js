const express = require("express");
const app = express();

// configure Express app
app.set('port', process.env.PORT || 3000);
app.use('/api', require('cors')());

const jobs = require("./jobs");
const meetup = require("./meetup");
const trends = require("./trends");
const scc = require("./scc");
const streetends = require("./streetends");

// Routes
app.get('/', function(req,res) {
    res.type('text/plain'); 
    res.send('Found');
});

app.get('/api/calendar', function(req,res) {
    meetup.events(function (events) {
        if (events) {
            res.setHeader('Cache-Control', 'public, max-age=120');
            res.setHeader('Last-Modified', (new Date()).toUTCString());
            res.json(events);    
        } else {
            res.status(404).send("404 - not found");    
        }
    });
});

app.get('/api/stmjobs', function(req,res) {
    meetup.jobs(function (jobs) {
        if (jobs) {
            res.setHeader('Cache-Control', 'public, max-age=120');
            res.setHeader('Last-Modified', (new Date()).toUTCString());
            res.json(jobs);    
        } else {
            res.status(404).send("404 - not found");    
        }
    });
});

app.get('/api/jobs', function(req,res) {
    req.setTimeout(10000,function () {
      console.log('request timed out');
    });

    jobs.getjobs(req.url, (results) => {
        if (results) {
          res.setHeader('Cache-Control', 'private, max-age=120');
          res.setHeader('Last-Modified', (new Date()).toUTCString());
          res.json(results);    
        } else {
            res.json([]);    
        }
    });

});

app.get('/api/streetends/:content', (req,res) => {
    streetends.fetchData(req.params.content, (data) => {
        if (data) {
            res.setHeader('Cache-Control', 'public, max-age=120');
            res.setHeader('Last-Modified', (new Date()).toUTCString());
            res.json(data);
        } else {
            res.status(404).send("404 - not found");
        }
    });
});

// legacy url
app.get('/getjobs', function(req,res) {
    req.setTimeout(10000,function () {
      console.log('request timed out');
    });

    jobs.getjobs(req.url, (results) => {
        if (results) {
          res.setHeader('Cache-Control', 'private, max-age=120');
          res.setHeader('Last-Modified', (new Date()).toUTCString());
          res.json({'jobs': results });    
        } else {
            res.json([]);    
        }
    });
  
});

app.get('/getsalaries', function(req,res) {
  trends.getsalaries(req, res);
});

app.get('/api/v1/classes/:campus/:dept/:yrq', (req,res) => {
    req.setTimeout(10000, () => {
     console.log('request timed out');
    });

    scc.classes(req.params.campus, req.params.dept, req.params.yrq, (results) => {
        if (results) {
        //   res.setHeader('Cache-Control', 'private, max-age=120');
        //   res.setHeader('Last-Modified', (new Date()).toUTCString());
          res.json(results);    
        } else {
            res.json({});    
        }
    });
});

exports.start = function() {
  app.listen(app.get('port'), function() {
      console.log('Express started');    
  });
};