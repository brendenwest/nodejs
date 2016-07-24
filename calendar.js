var http = require('https'); 

exports.events = function( callback) {
	var endpoint = "https://api.meetup.com/self/calendar?key=712d6c707945967181c1c15947504a&fields=group_category&only=time,name,link,group";
    var now = Date.now();
    var categories = [2,13,34];

    return http.get(endpoint, function(response) {

        // Continuously update stream with data
        var body = '';
        response.on('data', function(d) {
            body += d;
        });
        
        response.on('end', function() {

        	// toss events older than today+7
        	// keep only events w/ status=upcoming
        	var all_events = JSON.parse(body);            
        	var filtered = all_events.filter(function(event){
                var timeDiff = Math.abs(event.time - now); 
				var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                return categories.indexOf(event.group.category.id) > -1 && diffDays <= 14;
        	});

            callback(filtered);
        });
    }).end();
}