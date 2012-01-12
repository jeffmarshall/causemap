var cdb = require('felix-couchdb');
var reset = require('../lib/causemap/db').reset;

var c = cdb.createClient(5984, 'localhost', 'jeff', 'sbrooden');


reset(c, console.log);
