var http = require("http");
var url = require('url'); 
var api = require("./api");

function start() {
  function onRequest(request, response) {
  	var pathname = url.parse(request.url).pathname;
	switch(pathname) {
	case '/getjobs':
		api.getjobs(request, response);

	break;
	default:
    	response.writeHead(200, {"Content-Type": "text/plain"});
    	response.write("Hello World");
    	response.end();
	}
  }

  http.createServer(onRequest).listen(8888);
  console.log("Server has started.");
}

exports.start = start;