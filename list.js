var ops = require('./ops');
var async = require('async');
var _ = require('underscore');



function earliestChanges(){
  var callback = arguments[arguments.length -1];
  var options = arguments.length === 2 ? arguments[0] : {};

  var default_view_options = {
    limit: 15
  }

  var view_options = _.extend(default_view_options, options);

  if (view_options.limit < 1){
    delete view_options.limit;
  }

  ops.view('changes', 'by_creation_date', view_options, 
    function(view_error, changes){
      if (view_error){
        return callback(view_error, null);
      }

      if (changes.length === 0){
        return callback(null, changes);
      }

      function attachChanged(change, map_callback){
        ops.get(change.changed._id, function(get_changed_error, changed){
          if (get_changed_error){
            return map_callback(get_changed_error, null);
          }

          change.changed = changed;
          map_callback(null, change);
        });
      }

      async.map(changes, attachChanged, 
        function(map_error, changes_with_changed){
          if (map_error){
            return callback(map_error, null);
          }

          return callback(null, changes_with_changed);
        }
      );
    }
  );
}



function earliestRelations(){
  var callback = arguments[arguments.length -1];
  var options = arguments.length === 2 ? arguments[0] : {};

  var default_view_options = {
    limit: 15
  }

  var view_options = _.extend(default_view_options, options);

  if (view_options.limit < 1){
    delete view_options.limit;
  }

  ops.view('relations', 'by_creation_date', view_options, 
    function(view_error, relations){
      if (view_error){
        return callback(view_error, null);
      }

      if (relations.length === 0){
        return callback(null, relations);
      }

      function attachCauseAndEffect(relation, map_callback){
        function attachCause(parallel_callback){
          ops.get(relation.cause._id, function(get_cause_error, cause){
            if (get_cause_error) {
              return parallel_callback(get_cause_error, null);
            }

            relation.cause = cause;
            return parallel_callback(null, cause);
          });
        }

        function attachEffect(parallel_callback){
          ops.get(relation.effect._id, function(get_effect_error, effect){
            if (get_effect_error) {
              return parallel_callback(get_effect_error, null);
            }

            relation.effect = effect;
            return parallel_callback(null, effect);
          });
        }

        async.parallel([attachCause, attachEffect], 
          function(parallel_error, parallel_result){
            if (parallel_error){
              return map_callback(parallel_error, null);
            }

            return map_callback(null, relation);
          }
        );
      }

      async.map(relations, attachCauseAndEffect, 
        function(map_error, relations_with_cause_and_effect){
          if (map_error){
            return callback(map_error, null);
          }
      
          return callback(null, relations_with_cause_and_effect);
        }
      );
    }
  );
}



function earliestSituations(){
  var callback = arguments[arguments.length -1];
  var options = arguments.length === 2 ? arguments[0] : {};

  var default_view_options = {
    limit: 15
  }

  var view_options = _.extend(default_view_options, options);

  if (view_options.limit < 1){
    delete view_options.limit;
  }

  ops.view('situations', 'by_creation_date', view_options, 
    function(view_error, situations){
      if (view_error){
        return callback(view_error, null);
      }

      return callback(null, situations);
    }
  );
}



function latestChanges(){
  var callback = arguments[arguments.length -1];
  var options = arguments.length === 2 ? arguments[0] : {};

  var default_view_options = {
    limit: 15,
    descending: true
  }

  var view_options = _.extend(default_view_options, options);

  if (view_options.limit < 1){
    delete view_options.limit;
  }

  earliestChanges(view_options, callback);
}



function latestRelations(){
  var callback = arguments[arguments.length -1];
  var options = arguments.length === 2 ? arguments[0] : {};

  var default_view_options = {
    limit: 15,
    descending: true
  }

  var view_options = _.extend(default_view_options, options);

  if (view_options.limit < 1){
    delete view_options.limit;
  }

  earliestRelations(view_options, callback);
}



function latestSituations(){
  var callback = arguments[arguments.length -1];
  var options = arguments.length === 2 ? arguments[0] : {};

  var default_view_options = {
    limit: 15,
    descending: true
  }

  var view_options = _.extend(default_view_options, options);

  if (view_options.limit < 1){
    delete view_options.limit;
  }

  earliestSituations(view_options, callback);
}



function situationsMarked(){
  var mark_name = arguments[0];
  var callback = arguments[arguments.length -1];
  var options = arguments.length === 3 ? arguments[1] : {};

  var default_view_options = {
    startkey: [mark_name + '\u9999'],
    endkey: [mark_name],
    descending: true
  }

  var view_options = _.extend(default_view_options, options);

  ops.view('situations', 'marked', view_options, callback);
}



function relationsMarked(){
  var mark_name = arguments[0];
  var callback = arguments[arguments.length -1];
  var options = arguments.length === 3 ? arguments[1] : {};

  var default_view_options = {
    startkey: [mark_name + '\u9999'],
    endkey: [mark_name],
    descending: true
  }

  var view_options = _.extend(default_view_options, options);

  ops.view('relations', 'marked', view_options, callback);
}



function changesToDocument(){
  var doc_id = arguments[0];
  var callback = arguments[arguments.length -1];
  var options = arguments.length === 3 ? arguments[1] : {};

  var default_view_options = {
    startkey: [doc_id + '\u9999'],
    endkey: [doc_id],
    descending: true,
    limit: 15
  }

  var view_options = _.extend(default_view_options, options);

  if (view_options.limit < 1){
    delete view_options.limit;
  }

  ops.view('changes', 'by_changed', view_options, 
    function(view_error, changes){
      if(view_error){
        return callback(view_error, null);
      }

      return callback(null, changes);
    }
  );
}



function effectsOfSituation(){
  var situation_id = arguments[0];
  var callback = arguments[arguments.length -1];
  var options = arguments.length === 3 ? arguments[1] : {};

  var default_view_options = {
    startkey: [situation_id, 'cause' + '\u9999'],
    endkey: [situation_id, 'cause'],
    descending: true,
    limit: 15
  }

  var view_options = _.extend(default_view_options, options);

  if (view_options.limit < 1){
    delete view_options.limit;
  }

  ops.view('relations', 'by_cause_and_effect', view_options, 
    function(view_error, relations){
      if(view_error){
        return callback(view_error, null);
      }

      if (relations.length === 0){
        return callback(null, relations);
      }

      function attachEffect(relation, map_callback){
        ops.get(relation.effect._id, function(get_effect_error, effect){
          if (get_effect_error){
            return map_callback(get_effect_error, null);
          }

          relation.effect = effect;
          return map_callback(null, relation)
        });
      }

      async.map(relations, attachEffect, 
        function(map_error, relations_with_effect){
          if (map_error){
            return callback(map_error, null);
          }

          return callback(null, relations_with_effect);
        }
      );
    }
  );
}



function causesOfSituation(){
  var situation_id = arguments[0];
  var callback = arguments[arguments.length -1];
  var options = arguments.length === 3 ? arguments[1] : {};

  var default_view_options = {
    startkey: [situation_id, 'effect' + '\u9999'],
    endkey: [situation_id, 'effect'],
    descending: true,
    limit: 15
  }

  var view_options = _.extend(default_view_options, options);

  if (view_options.limit < 1){
    delete view_options.limit;
  }

  ops.view('relations', 'by_cause_and_effect', view_options, 
    function(view_error, relations){
      if(view_error){
        return callback(view_error, null);
      }

      if (relations.length === 0){
        return callback(null, relations);
      }

      function attachCause(relation, map_callback){
        ops.get(relation.cause._id, function(get_cause_error, cause){
          if (get_cause_error){
            return map_callback(get_cause_error, null);
          }

          relation.cause = cause;
          return map_callback(null, relation);
        });
      }

      async.map(relations, attachCause, 
        function(map_error, relations_with_cause){
          if (map_error){
            return callback(map_error, null);
          }

          return callback(null, relations_with_cause);
        }
      );
    }
  );
}



module.exports = {
  earliest: {
    situations: earliestSituations,
    changes: earliestChanges,
    relations: earliestRelations
  },
  latest: {
    situations: latestSituations,
    changes: latestChanges,
    relations: latestRelations
  },
  situations: {
    marked: situationsMarked
  },
  relations: {
    marked: relationsMarked
  },
  changes: changesToDocument,
  effects: effectsOfSituation,
  causes: causesOfSituation
}
