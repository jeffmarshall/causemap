var config = require('../config');
var db = require('../db');



function getSituation(situation_id, callback){
  db.get(situation_id, callback);
}



module.exports = getSituation;
