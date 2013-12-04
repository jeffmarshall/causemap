var _ = require('lodash');
var async = require('async');
var config = require('../../config');
var Relationship = require('cartography').models.Relationship;



var es_config = config.get('elasticsearch');
var main_index_name = es_config.indexes.main;
var suggestion_index_name = es_config.indexes.suggestion;

module.exports = function updateOperationsForRelationship(
  doc,
  callback
){
  var relationship = new Relationship(doc._id);

  async.parallel([
    function(parallel_callback){
      relationship.summarize(function(
        summarization_error, 
        relationship_summary
      ){
        if (summarization_error){
          return parallel_callback(summarization_error, null);
        }

        var cause = relationship_summary.cause;
        var effect = relationship_summary.effect;

        [relationship_summary, cause, effect].forEach(function(doc){
          delete doc._rev;
          delete doc.immutable;
          delete doc.revisable;
        });

        relationship_summary.cause = cause;
        relationship_summary.effect = effect;
        
        return parallel_callback(null, relationship_summary)
      });
    },

    function(parallel_callback){
      relationship.strength(function(strength_error, strength_rating){
        if (strength_error) return parallel_callback(strenght_error, null);
        return parallel_callback(null, { strength: strength_rating })
      });
    }
  ], function(parallel_error, parallel_results){
    if (parallel_error) return callback(parallel_error, null);

    var summary = {};

    parallel_results.forEach(function(result){
      summary = _.extend(summary, result);
    });

    return callback(null, [
      {
        index: {
          index: main_index_name,
          type: doc.type,
          id: doc._id,
          data: summary
        }
      }
    ]);
  });
}
