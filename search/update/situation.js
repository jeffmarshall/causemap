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
    }
  ], function(parallel_error, parallel_result){
    if (parallel_error){ return callback(parallel_error, null) }

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
