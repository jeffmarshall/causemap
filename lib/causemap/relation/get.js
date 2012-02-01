var config = require('../config');
var db = require('../db');



function getRelation(relation_id, callback){
  db.get(relation_id, callback);
}



module.exports = getRelation;
