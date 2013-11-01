var nano = require('nano');
var config = require('../../config');



function initNano(){
  return nano(config.get('couchdb').host);
}

function initDB(){
  return initNano().use(config.get('couchdb').database);
}


module.exports.nano = initNano;
module.exports.db = initDB;
