var _ = require('underscore');
var async = require('async');
var nano = require('nano')('http://localhost:5984');

var situation_db = nano.use('situations');
var relation_db = nano.use('relations');



function getSituationStubs(situation_ids, callback){
  async.map(situation_ids, situation_db.get, function(err, res){
    if (err){
      callback(err, null);
      return
    }

    callback(null, res.map(function(result){
      return {title: result.title, impact: result.impact, _id: result._id}
    }));
  });
}



function getCausesForSituation(situation_id, callback){
  relation_db.view('sort_by', 'effect', {
    key: situation_id
  }, function(err, res){
    if (err){
      callback(err, res);
      return;
    }

    if (res.rows.length == 0){
      callback(null, []);
      return;
    }
    
    var cause_relation_objects = res.rows.map(function(row){
      return row.value;
    });

    var cause_ids = res.rows.map(function(row){
      return row.value.cause
    });

    getSituationStubs(cause_ids, function(err, stubs){
      if (err){
        callback(err, null);
        return;
      }

      for (i in stubs){
        var stub = stubs[i];
        cause_relation_objects[i].title = stub.title;
        
        if (stub.impact){
          cause_relation_objects[i].impact = stub.impact
        }
      }

      callback(null, cause_relation_objects);
    });

  });
}



function getEffectsForSituation(situation_id, callback){
  relation_db.view('sort_by', 'cause', {
    key: situation_id
  }, function(err, res){
    if (err){
      callback(err, res);
      return;
    }

    if (res.rows.length == 0){
      callback(null, []);
      return;
    }
    
    var effect_relation_objects = res.rows.map(function(row){
      return row.value;
    });

    var effect_ids = res.rows.map(function(row){
      return row.value.effect
    });

    getSituationStubs(effect_ids, function(err, stubs){
      if (err){
        callback(err, null);
        return;
      }

      for (i in stubs){
        var stub = stubs[i];
        effect_relation_objects[i].title = stub.title;
        
        if (stub.impact){
          effect_relation_objects[i].impact = stub.impact
        }
      }

      callback(null, effect_relation_objects)
    });

  });
}



function getSituationByID(situation_id, callback){
  // What we need:
  // - situation details
  // - all relationships 
  // - situation titles for each relationship

  function getSit(cb){
    situation_db.get(situation_id, function(err, doc, headers){
      if (err){
        cb(err, null);
        return;
      }

      cb(null, doc);
    });
  }

  function getCauses(cb){
    getCausesForSituation(situation_id, cb);
  }

  function getEffects(cb){
    getEffectsForSituation(situation_id, cb);
  }

  async.parallel([
    getSit,
    getCauses,
    getEffects
  ], function(err, results){
    if (err){
      callback(err, null);
      return;
    }

    var situation = results[0];

    situation.causes = results[1];
    situation.effects = results[2];

    callback(null, situation)
  });
}


module.exports.stubs = getSituationStubs;
module.exports.causes = getCausesForSituation;
module.exports.effects = getEffectsForSituation;
module.exports.get = getSituationByID;
