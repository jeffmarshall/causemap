var config = require('./config');
var designs = require('./db/designs');
var errors = require('./errors');
var nano = require('nano');
var async = require('async');
var _ = require('underscore');



function initNano(){
  return nano(config.get('dbhost'));
}


function initDb(){
  return initNano().use(config.get('dbname'));
}



function insert(){
  initDb().insert.apply(this, arguments);
}


function get(){
  initDb().get.apply(this, arguments);
}


function view(){
  initDb().view.apply(this, arguments);
}


function deleteDoc(doc_id, callback){
  var callback = callback || function(){};

  var db = initDb();

  db.get(doc_id, function(get_error, doc){
    if (get_error){
      return callback(get_error, null);
    }

    db.destroy(doc._id, doc._rev, function(destroy_error, destroy_result){
      if (destroy_error){
        if (destroy_error === 'conflict'){
          return delete(doc_id, callback);
        }
        return callback(destroy_error, null);
      }

      return callback(null, destroy_result);
    });
  });
}


function viewOrInsertDesign(){
  var design_name = arguments[0];
  var view_name = arguments[1];
  var callback = arguments[arguments.length -1] || function(){};
  var view_options = arguments.length === 4 ? arguments[2] : {};

  function formatViewResult(view_result){
    return _.map(view_result.rows, function(row){
      return row.value;
    });
  }

  view(design_name, view_name, view_options, function(view_error, view_result){
    if (view_error){
      if (view_error.error === 'not_found'){
        var design = designs[design_name];

        if (design === undefined){
          return callback(errors.designNotFound(design_name), null);
        }

        insert(design, design._id, function(insert_error, insert_result){
          if (insert_error){
            if (insert_error === 'conflict'){
              return callback(view_error, null);
            }
            return callback(insert_error, null);
          }

          viewOrInsertDesign(design_name, view_name, view_options, callback);
        });
        return
      }
      return callback(view_error, null);
    }
    return callback(null, formatViewResult(view_result));
  });
}


function atomicOperation(doc_id, operation, callback){
  var callback = callback || function(){};

  get(doc_id, function(get_error, doc){
    if (get_error){
      return callback(get_error, null);
    }

    try {
      var altered_doc = operation(doc);
      if (!altered_doc){
        throw errors.operationDidNotReturnDoc();
      }
    } catch(operation_error){
      return callback(operation_error, null);
    }

    insert(altered_doc, function(insert_error, insert_result){
      if (insert_error){
        if (insert_error.error === 'conflict'){
          atomicOperation.apply(this, arguments);
          return
        }
        return callback(insert_error, null);
      }

      return callback(null, _.extend(altered_doc, {
        _id: insert_result._id,
        _rev: insert_result._rev,
      }));
    });
  });
}



module.exports = {
  insert: insert,
  get: get,
  view: viewOrInsertDesign,
  del: deleteDoc,
  atomic: atomicOperation
}
