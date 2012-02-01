var config = require('./config');
var couchdb_host = config.get('couchdb_host') || 'http://localhost:5984';
var nano = require('nano')(couchdb_host);

var db_name = config.get('couchdb_name') || 'causemap';
var db = nano.use(db_name);



module.exports = db;
