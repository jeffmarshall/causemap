var _ = require('lodash');

var Doc = require('../../models/doc');
var es = require('../client');
var updateOperationsForRelationship = require('./relationship');
var updateOperationsForSituation = require('./situation');



module.exports = function deleteDeletedDoc(deleted_doc, callback){
  var update_ops = [];

  var split_id = deleted_doc._id.split(':');

  if (split_id.indexOf('adjusted') > -1){
    var adjusted = { doc: {}, field: {} };
    adjusted.doc._id = deleted_doc._id.split(':')[2];
    adjusted.field.name = deleted_doc._id.split(':')[3];

    var adjusted_doc = new Doc(adjusted.doc._id);

    return adjusted_doc.read(function(read_error, adjusted_doc_body){
      if (read_error) return callback(read_error, null);
      adjusted.doc.type = adjusted_doc_body.type;

      if(adjusted_doc_body.type == 'relationship'){
        return updateOperationsForRelationship(
          adjusted.doc,
          function(ops_error, operations){
            if (ops_error){ return callback(ops_error, null) }
            update_ops.push(operations);
            return callback(null, _.flatten(update_ops));
          }
        );
      }
    });
  }

  if (split_id.indexOf('bookmarked') > -1){
    var bookmarked_doc = new Doc(split_id[2]);

    return bookmarked_doc.read(function(read_error, bookmarked_doc_body){
      if (read_error) return callback(read_error, null);
      if (bookmarked_doc_body.type == 'situation'){
        return updateOperationsForSituation(
          bookmarked_doc_body,
          function(ops_error, operations){
            if (ops_error){ return callback(ops_error, null) }
            update_ops.push(operations);
            return callback(null, _.flatten(update_ops));
          }
        )
      }
    })
  }

  es().search({
    filter: {
      term: { _id: doc._id }
    }
  }, function(search_error, search_result){
    if (search_error){ return callback(search_error, null) }

    var deletion_ops = search_result.hits.map(function(hit){
      return {
        delete: {
          index: hit._index,
          type: hit._type,
          id: hit._id
        }
      }
    });

    return callback(null, deletion_ops);
  });
}
