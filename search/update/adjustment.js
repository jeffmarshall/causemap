var _ = require('lodash');
var async = require('async');
var config = require('../../config');
var models = require('../../models');

var Adjustment = models.Adjustment;
var Situation = models.Situation;

var updateOperationsForSituation = require('./situation');
var updateOperationsForRelationship = require('./relationship');



var es_config = config.get('elasticsearch');
var main_index_name = es_config.indexes.main;
var suggestion_index_name = es_config.indexes.suggestions;

module.exports = function updateOperationsForAdjustment(
  doc,
  callback
){
  var adjustment = doc;
  console.log('doc:', adjustment);

  var update_ops = [];

  var adjusted = adjustment.adjusted;

  if(adjusted.doc.type == 'relationship' && adjusted.field.name == 'strength'){
    updateOperationsForRelationship(
      adjusted.doc,
      function(ops_error, operations){
        if (ops_error){ return callback(ops_error, null) }
        update_ops.push(operations);
        return callback(null, _.flatten(update_ops));
      }
    );
  }
}
