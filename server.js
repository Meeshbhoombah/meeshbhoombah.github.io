/**
 *
 * server.js
 * init packages, config middleware
 * front-facing routes, import models/views/controllers
 *
 */

const express = require('express');
const mongoose = require('mongoose');
const exphb = require('express-handlebars');
const path = require('path');
const bodyParser = require('body-parser')
const app = express();

// connection to database
const connection = 'mongodb://127.0.0.1/blog';
mongoose.connect(connection, {
    useMongoClient: true
})

// import models
var Article = require('./models/article');

// configure app
app.set('port', 3000);
app.set('views', __dirname + '/views');
app.engine('handlebars', exphb({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(morgan('combined'));

// server start on 'port'
app.listen(app.get('port'), function () {
    console.log("Listening on port " + app.get('port'));
}); 
