var request = require('request');
var drive = require("drive-db")(process.env.drive.replace(/^\s+/, '').replace(/\s+$/, ''));
drive.onload = require('./driveafter');
drive.timeout = 1;

var categories = ['startup', 'charla', 'blog', 'concurso', 'proyecto', 'taller', 'visita'];



// The index file
exports.index = function(req, res) {

  drive.load(function(err, db){

    if (err) {
      return console.log(err);
    }

    // Load all of the articles
    var articles = db.find({ published: 1 });

    var hot = db.find({ hot: 1, published: 1 })[0];

    // Show the main page
    res.render('index', { blog: articles, categories: categories, hot: hot });
  });
};


// Seen each article
exports.article = function(req, res) {

  if(req.url.substr(-1) == '/' && req.url.length > 1) {
    return res.redirect(301, req.url.slice(0, -1));
  }

  drive.load(function(err, db){

    if (err) return console.log(err);

    // Load the requested article and next one
    var article = db.find({ id: req.params.id })[0];
    var all = db.find({ published: 1 });
    var next = all[all.indexOf(article) + 1] || false;

    // No article found
    if (!article) {
      return res.status(404).render('404');
    }

    // There's no form inside the article
    return res.render('article', { article: article, next: next });
  });
};
