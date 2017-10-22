/**
 * 
 * article.js
 * defining schema for article
 *
 */

var mongoose = require('mongoose');
var Schema = mongoose.schema;

var articleSchema = new Schema({
    created_at      : Date
    , title         : String
    , text          : String
    , published     : { type: Boolean, default: false }
    , published_at  : { type: Date, validate: function () { return this.published = true } } 
});

module.exports = mongoose.model('Article', articleSchema);

