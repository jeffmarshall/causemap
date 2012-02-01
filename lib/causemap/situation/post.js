var db = require('../db');



function postSituation(situation, callback){
  db.insert(situation, callback);
}



module.exports = postSituation;
