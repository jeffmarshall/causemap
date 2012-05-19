var ops = require('./ops');
var async = require('async');
var _ = require('underscore');
var fetch = require('./fetch');




function deleteRelation(relation_id, callback){
  var callback = callback || function(){};

  fetch.relation(relation_id, function(fetch_error, relation){
    if (fetch_error){
      return callback(fetch_error, null);
    }

    var view_options = {
      startkey: [relation._id],
      endkey: [relation._id + '\u9999']
    }

    ops.view('changes', 'by_changed', view_options, function(view_error, changes){
      if (view_error){
        return callback(view_error, null);
      }

      function deleteDoc(doc, map_callback){
        ops.del(doc._id, map_callback);
      }

      async.map(changes, deleteDoc, function(map_error, deletion_results){
        if(map_error){
          return callback(map_error, null);
        }

        // all changes were successfully deleted
        ops.del(relation._id, function(deletion_error, deletion_result){
          if (deletion_error){
            return callback(deletion_error, null);
          }

          return callback(null, {
            ok: true, 
            deleted: relation,
            dependents: changes
          });
        });
      });
    });
  });
}


function deleteSituation(situation_id, callback){
  var callback = callback || function(){};

  fetch.situation(situation_id, function(fetch_error, situation){
    if (fetch_error){
      return callback(fetch_error, null);
    }

    async.parallel([
      function(parallel_callback){
        var view_options = {
          startkey: [situation._id],
          endkey: [situation._id + '\u9999']
        }

        ops.view(
          'relations', 
          'by_cause_and_effect', 
          view_options, 
          parallel_callback);
      },
      function(parallel_callback){
        var view_options = {
          startkey: [situation._id],
          endkey: [situation._id + '\u9999']
        }

        ops.view(
          'changes',
          'by_changed', 
          view_options,
          parallel_callback);
      }
    ], function(parallel_error, parallel_result){
      if (parallel_error){
        return callback(parallel_error, null);
      }

      // these docs are dependent on the situation
      var docs_for_deletion = _.flatten(parallel_result);

      function deleteDoc(doc, map_callback){
        if (doc.type === 'relation'){
          return deleteRelation(doc._id, map_callback);
        }

        ops.del(doc._id, map_callback);
      }

      // delete the dependent docs
      async.map(docs_for_deletion, deleteDoc, function(map_error, map_result){
        if (map_error){
          return callback(map_error, null);
        }

        // once the dependents are deleted, delete the original situation
        ops.del(situation._id, function(deletion_error, deletion_result){
          if (deletion_error){
            return callback(deletion_error, null);
          }

          return callback(null, {
            ok: true,
            deleted: {
              situation: situation,
              dependents: docs_for_deletion
            }
          });
        });
      });
    });
  });
}




module.exports = {
  situation: deleteSituation
  // TODO
  // relation: deleteRelation
}
