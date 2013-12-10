var _ = require('lodash');
var async = require('async');
var config = require('../../config');
var Situation = require('cartography').models.Situation;



var es_config = config.get('elasticsearch');
var situation_index_name = es_config.indexes.situations;
var suggestion_index_name = es_config.indexes.suggestions;

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

    delete body._rev;
    delete body.immutable;
    delete body.revisable;
    body.popularity = popularity;
    body.controversiality = controversiality;

    summary = _.clone(body);
    delete summary.description;

    var update_ops = [
      {
        index: {
          index: situation_index_name,
          type: doc.type,
          id: doc._id,
          data: body
        }
      }
    ]

    if (summary.title){
      update_ops.push({
        index: {
          index: suggestion_index_name,
          type: doc.type,
          id: doc._id,
          data: summary
        }
      });
    }

    return callback(null, update_ops);
  });
}
