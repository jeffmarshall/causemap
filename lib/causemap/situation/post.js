var async = require('async');
var nano = require('nano')('http://localhost:5984');

var situation_db = nano.use('situations');
var relation_db = nano.use('relations');



function postSituation(situation, callback){

  function saveSit(cb){
    situation_db.insert({
      title: situation.title,
      description: situation.description,
      creation_date: new Date()
    }, function(err, res, headers){
      situation.id = res.id;
      cb(err, res);
    });
  }

  function saveRelations(cb){
    
    function makeSaveRelationOperation(cause_id, effect_id){
      return function(c){
        relation_db.insert({
          cause: cause_id,
          effect: effect_id,
          strength: 1
        }, function(err, res, headers){
          c(err, res);
        });
      }
    }

    var list_of_relation_operations = [];

    for (i in situation.causes){
      var cause = situation.causes[i];
      var effect = situation.id;

      list_of_relation_operations.push(
        makeSaveRelationOperation(cause, effect)
      );
    }

    for (i in situation.effects){
      var effect = situation.effects[i];
      var cause = situation.id;

      list_of_relation_operations.push(
        makeSaveRelationOperation(cause, effect)
      );
    }


    async.parallel(list_of_relation_operations, function(err, res){
      cb(err, res);
    });
  }

  async.series([
    saveSit,
    saveRelations
  ], function(err, res){
    if (err){
      callback(err, null);
      return;
    }

    callback(null, situation);
  });

}



module.exports = postSituation;
