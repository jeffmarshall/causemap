var ops = require('./ops');
var errors = require('./errors');
var async = require('async');




fetchSituation = function(situation_id, callback){
  var callback = callback || function(){};

  view_options = {
    startkey: [situation_id],
    endkey: [situation_id + '\u9999']
  }

  ops.view('identify', 'situation', view_options, 
    function(view_error, view_results){
      if (view_error){
        return callback(view_error, null);
      }

      if (view_results.length === 0){
        return callback(errors.notFound(situation_id), null);
      }

      for (var i=0; i < view_results.length; i++){
        var doc = view_results[i];
        if(doc.type === 'situation'){
          return callback(null, doc);
        }

        if(doc.type === 'change'){
          var change = doc;
          ops.get(change.changed._id, function(get_changed_error, changed){
            if (get_changed_error){
              return callback(get_changed_error, null);
            }

            if (changed.type === 'situation'){
              var situation = changed;
              situation.moved = change;

              return callback(null, situation);
            }
          });
        }
      } 
    }
  );
}



function fetchChange(change_id, callback){
  var callback = callback || function(){};

  ops.get(change_id, function(get_change_error, change){
    if (get_change_error){
      return callback(get_change_error, null);
    }

    ops.get(change.changed._id, function(get_changed_error, changed){
      if (get_changed_error){
        return callback(get_changed_error, null);
      }

      change.changed = changed;

      callback(null, change);
    });
  });
}



function fetchRelation(relation_id, callback){
  var callback = callback || function(){};

  ops.get(relation_id, function(get_relation_error, relation){
    if (get_relation_error){
      return callback(get_relation_error, null);
    }

    function attachCause(parallel_callback){
      ops.get(relation.cause._id, function(get_cause_error, cause){
        if (get_cause_error){
          return parallel_callback(get_cause_error, null);
        }

        relation.cause = cause;
        
        parallel_callback(null, cause);
      });
    }
    
    function attachEffect(parallel_callback){
      ops.get(relation.effect._id, function(get_effect_error, effect){
        if (get_effect_error){
          return parallel_callback(get_effect_error, null);
        }
    
        relation.effect = effect;
        
        parallel_callback(null, effect);
      });
    }

    async.parallel([
      attachCause,
      attachEffect
    ], function(parallel_error, parallel_results){
      if (parallel_error){
        return callback(parallel_error, null);
      }

      return callback(null, relation);
    });
  });
}




module.exports = {
  situation: fetchSituation,
  relation: fetchRelation,
  change: fetchChange
}
