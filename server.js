var express = require("express");
var app = express();

// configure Express app
app.set('port', process.env.PORT || 3000);
app.use('/api', require('cors')());

var jobs = require("./jobs");
var calendar = require("./calendar");
var trends = require("./trends");

// Routes
app.get('/', function(req,res) {
    res.type('text/plain'); 
    res.send('Found');
});

app.get('/api/calendar', function(req,res) {
    calendar.events(function (events) {
        if (events) {
            res.json(events);    
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

exports.start = function() {
  app.listen(app.get('port'), function() {
      console.log('Express started');    
  });
};