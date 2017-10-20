/**
 *
 * server.js
 * base config
 *
 */

var express = require('express');
var path = require('path');
var mongoose = require('mongoose');
var exphb = require('express-handlebars');
var bodyParser = require('body-parser')
var errorHandler = require('errorhandler');
var morgan = require('morgan');

var app = express();

// connection to database
connection = 'mongodb://127.0.0.1/blog';
mongoose.connect(connection, {
    useMongoClient: true
})

// configure application
app.set('port', 3000);
app.set('views', __dirname + '/views');
app.engine('handlebars', exphb({defaultLayout: 'index'}));
app.set('view engine', 'handlebars');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(morgan('combined'))

// server start on 'port'
app.listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
});

