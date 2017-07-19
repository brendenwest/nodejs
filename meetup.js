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

exports.jobs = function( callback) {
    var endpoint = "https://api.meetup.com/seattle-tech-mentors/boards/20075740/discussions?key=712d6c707945967181c1c15947504a&page=20&only=subject,created,id,started_by";
    var now = Date.now();

    return http.get(endpoint, function(response) {

        // Continuously update stream with data
        var body = '';
        response.on('data', function(d) {
            body += d;
        });
        
        response.on('end', function() {

            // toss jobs older than today+14
            var all_items = JSON.parse(body);            
            var filtered = all_items.filter(function(item){
                var timeDiff = Math.abs(item.created - now); 
                var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                return diffDays <= 14;
            });

            callback(filtered);
        });
    }).end();
}