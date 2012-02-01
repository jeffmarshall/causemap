var db = require('../db');



function postRelation(relation, callback){
  db.insert(relation, callback);
}



module.exports = postRelation;
