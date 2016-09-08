// Load request module
var request = require('request');
var cheerio = require('cheerio');
var sprite = require('node-sprite');
var fs = require('fs');


// Manipulations for the data returned from the database
module.exports = function (saveCache){

  // Cache the months
  var months = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];

  var driveFolder = "https://googledrive.com/host/" + process.env.articles + "/";

  var drive = this;

  function docUrl (text) {
    var timestamp = parseInt(Math.random() * 1000000000);
    return "https://docs.google.com/document/d/" + text + "/pub?timestamp=" + timestamp;
  }

  this.data = this.data.filter(function(e){ return !!e.id && e.published == 1; });

  // Loop through all of the rows
  this.data.forEach(function(value, index) {

    // Store the article
    function storeArticle(err, response, content) {

      if (err) return console.log("Request error: ", err);

      // Load jquery
      var $ = cheerio.load(content);

      // Extract only the interesting css
      var cssRaw = $("body style").html();
      var cssRegex = /(\.c[0-9]*\s*\{[_a-zA-Z0-9-:;# ]*\})/g;
      var cssArray = (cssRaw) ? cssRaw.match(cssRegex) : ["", ""];
      var css = cssArray ? cssArray.join("") : "";
      var style = "<style>" + css + "</style>";

      // Extract the content from the body
      var bodyHTML = $("body #contents");
      bodyHTML.find("style").remove();

      // Delete empty lines
      bodyHTML.find("span:empty").remove();
      bodyHTML.find("p:empty").remove();
      var body = bodyHTML.html();

      // Write it only if there's something to write
      if (css.length || (body && body.length)) {

        // Write the cache
        fs.writeFile("db/" + value.id + ".html", body);
        fs.writeFile("db/" + value.id + ".css", css);
      }
    }


    if (value.timestamp) {
      // Make it pretty
      var date = value.timestamp.split("/");
      drive.data[index].date = date[0] + " " + months[date[1] - 1];

      // Make it pretty
      drive.data[index].timestamp = date[2] + "/" + date[1] + "/" + date[0];
      drive.data[index].datetime = date[2] + "-" + date[1] + "-" + date[0];
    }

    // Retrieve the images
    drive.data[index].img = driveFolder + "img/" + encodeURI(value.id) + ".jpg";

    var cacheFile = "db/" + value.id + ".html";
    var cacheStyle = "db/" + value.id + ".css";

    if (!fs.existsSync(cacheFile))
      fs.writeFileSync(cacheFile, "");

    if (!fs.existsSync(cacheStyle))
      fs.writeFileSync(cacheStyle, "");

    drive.data[index].content = fs.readFileSync(cacheFile, "utf-8");
    drive.data[index].style = fs.readFileSync(cacheStyle, "utf-8");


    // Save the image locally
    if (!fs.existsSync('./public/images/icons/' + value.id + '.jpg')) {
      var ws = fs.createWriteStream('./public/images/icons/' + value.id + '.jpg');
      ws.on('error', function(err) { console.log(err); });
      request(drive.data[index].img).pipe(ws);
    }

    drive.data[index].img = 'images/icons/' + encodeURIComponent(value.id) + '.jpg';

    function getFilesizeInKiloBytes(filename) {
      filename = __dirname + '/public/' + filename;
      if (!filename || !fs.existsSync(filename)) {
        return 0;
      }
      var stats = fs.statSync(filename);
      var fileSizeInBytes = stats["size"];
      console.log("Size:", fileSizeInBytes);
      return fileSizeInBytes / 1000;
    }

    if (getFilesizeInKiloBytes(drive.data[index].img) > parseInt(process.env.MAX_SIZE || 200)) {
      drive.data[index].img = '';
    }

    // Retrieve the individual articles
    request(docUrl(value.article), storeArticle);
  });

  // return the data
  return drive.data;
};
