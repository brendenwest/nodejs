const cheerio = require('cheerio');
const fetch = require('node-fetch')

const url = "https://www.streetends.org/"

const contacts = [
    {
        name: "Karen Daubert",
        email: "karendaubert@msn.com",
        phone: "206-310-1792",
        address: "Friends of Street Ends, c/o Leschi Community Council, 140 Lakeside Avenue, Suite A #2, Seattle, 98122"
    },
    {
        name: "Omar Akkari",
        title: "Shoreline Street Ends Program Coordinator",
        email: "omar.akkari@seattle.gov",
        phone: "206-233-5114"
    }
]

const parsePhotos = ($) => {
    const photos = [];
    $(".thumb-image").toArray().map(tag => {
        photos.push($(tag).attr("data-src"))
    });

    return photos;
}

const parseSchedule = ($) => {
    const events = [];
    const meetings = [];
    $("#block-yui_3_17_2_1_1532022540854_116293 div").children().toArray().map(tag => {
        const text = $(tag).text();
        if (tag.name == "h3" && text == "Upcoming events:") {
            events.push($(tag.next).text())
        }
        if (tag.name == "h3" && text == "Upcoming meetings:") {
            meetings.push($(tag.next).text())
        }
    });
    return {
        "events": events,
        "meetings": meetings
    }
}

exports.fetchData = (content, callback) => {
  fetch(url)
    .then(res => res.text())
    .then(body => {
        $ = cheerio.load(body);
        let data;
        if (content === "photos") {
            data = parsePhotos($);
        } else if (content === "contacts") {
            data = contacts;
        } else {
            data = parseSchedule($);
        }
        callback(data)
    })
    .catch(err => console.log(url))
}