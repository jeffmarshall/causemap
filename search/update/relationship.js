var _ = require('lodash');
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

  relationship.summarize(function(summarization_error, relationship_summary){
    if (summarization_error){
      return callback(summarization_error, null);
    }

    var relationship_summary_without_description = _.clone(
      relationship_summary
    )

    delete relationship_summary_without_description.description;

    return callback(null, [
      {index: {
        index: main_index_name,
        type: doc.type,
        id: doc._id,
        data: relationship_summary
      }},
      {index: {
        index: suggestion_index_name,
        type: doc.type,
        id: doc._id,
        data: relationship_summary_without_description
      }},
    ]);
  });
}
