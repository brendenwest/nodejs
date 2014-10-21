var http = require("http");
var url = require('url'); 
var api = require("./api");
var trends = require("./trends");

function start() {
  function onRequest(request, response) {
  	var pathname = url.parse(request.url).pathname;
	switch(pathname) {
  	case '/getjobs':
  		api.getjobs(request, response);
      break;
    case '/getsalaries':
      trends.getsalaries(request, response);
    	break;
  	default:
      	response.write("Hello World");
      	response.end();
  	}
  }

  http.createServer(onRequest).listen(process.env.PORT || 8881);
  console.log("Server has started.");
}

exports.start = start;