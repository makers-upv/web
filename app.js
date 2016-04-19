require('dotenv').config({ silent: true });
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var compress = require('compression');
var bodyParser = require('body-parser');
var blog = require("./blog.js");
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.locals.env = process.env;

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(compress());
app.use(express.static(path.join(__dirname, 'public')));


// Routing
app.get('/', blog.index);
app.get('/:id', blog.article);


// ERROR HANDLING
// catch 404 and forward to error handler
app.use(function(req, res, next){
  res.render('404');
});

app.listen(process.env.PORT || 3000);
