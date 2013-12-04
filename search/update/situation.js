var _ = require('lodash');
var async = require('async');
var config = require('../../config');
var Situation = require('cartography').models.Situation;



var es_config = config.get('elasticsearch');
var main_index_name = es_config.indexes.main;
var suggestion_index_name = es_config.indexes.suggestion;

module.exports = function updateOperationsForSituation(
  doc,
  callback
){
  var situation = new Situation(doc._id);
  var summary;
  var body;
  var popularity;
  var controversiality;

  async.parallel([
    function(parallel_callback){
      situation.read(function(read_error, doc_body){
        if (read_error){ return parallel_callback(read_error, null) }

        body = doc_body;
        return parallel_callback(null, doc_body);
      });
    },

    function(parallel_callback){
      situation.summarize(function(summarization_error, situation_summary){
        if (summarization_error){
          return parallel_callback(summarization_error, null)
        }

        summary = situation_summary;
        return parallel_callback(null, summary);
      });
    },
    
    function(parallel_callback){
      situation.popularity(function(popularity_error, popularity_rating){
        if (popularity_error) return parallel_callback(popularity_error, null);
        popularity = popularity_rating;
        return parallel_callback(null, popularity_rating);
      })
    },
    
    function(parallel_callback){
      situation.controversiality(function(
        controversiality_error, 
        controversiality_rating
      ){
        if (controversiality_error){
          return parallel_callback(controversiality_error, null);
        }

        controversiality = controversiality_rating;

        return parallel_callback(null, controversiality_rating);
      })
    }
  ], function(parallel_error, parallel_result){
    if (parallel_error){ return callback(parallel_error, null) }

    [body, summary].forEach(function(doc){
      delete doc._rev;
      delete doc.immutable;
      delete doc.revisable;
      doc.popularity = popularity;
      doc.controversiality = controversiality;
    });

    return callback(null, [
      {index: {
        index: main_index_name,
        type: doc.type,
        id: doc._id,
        data: body
      }},
      {index: {
        index: suggestion_index_name,
        type: doc.type,
        id: doc._id,
        data: summary
      }}
    ]);
  });
}
