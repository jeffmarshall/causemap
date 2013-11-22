var _ = require('lodash');
var async = require('async');
var config = require('../../config');
var Change = require('cartography').models.Change;
var Situation = require('cartography').models.Situation;

var updateOperationsForSituation = require('./situation');
var updateOperationsForRelationship = require('./relationship');



var es_config = config.get('elasticsearch');
var main_index_name = es_config.indexes.main;
var suggestion_index_name = es_config.indexes.suggestions;

module.exports = function updateOperationsForChange(
  doc,
  callback
){
  var change = doc;
  console.log('doc:', change);

  var update_ops = [{
    index: {
      index: main_index_name,
      type: doc.type,
      id: doc._id,
      data: change
    }
  }];

  var changed = change.changed;

  if(typeof changed.field.to != 'string'){ delete changed.field.to }

  if(changed.doc.type == 'relationship'){
    updateOperationsForRelationship(
      changed.doc,
      function(ops_error, operations){
        if (ops_error){ return callback(ops_error, null) }
        update_ops.push(operations);
        return callback(null, _.flatten(update_ops));
      }
    );
  }

  if (changed.doc.type == 'situation'){
    updateOperationsForSituation(changed.doc, function(ops_error, operations){
      if (ops_error){ return callback(ops_error, null) }
      update_ops.push(operations);
      
      if (
        ['title', 'period', 'location', 'alias'].indexOf(
          changed.field.name
        ) > -1
      ){
        var situation = new Situation(changed.doc._id);
        situation.relationships(function(search_error, search_result){
          if (search_error){ return callback(search_error, null) }

          parallel_ops = search_result.hits.map(function(hit){
            return function(parallel_callback){
              updateOperationsForRelationship(hit._source, function(
                ops_error,
                relationship_ops
              ){
                if (ops_error){ return parallel_callback(ops_error, null) }
                return parallel_callback(null, relationship_ops);
              });
            }
          });

          async.parallel(parallel_ops, function(
            parallel_error, 
            parallel_result
          ){
            if (parallel_error){ callback(parallel_error, null) }
            update_ops.push(parallel_result);
            return callback(null, _.flatten(update_ops));
          });
        });
      }

      else {
        return callback(null, _.flatten(update_ops));
      }
    });
  }
}
