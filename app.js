var express = require('express');
var nconf = require('nconf');

var app = express.createServer();

nconf.argv()
     .env()
     .file({ file: './config.json' });

app.listen(nconf.get('port'));
console.log('Listening on port', app.address().port)
