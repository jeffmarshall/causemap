var util = require('util');
var async = require('async');

var Doc = require('./doc');
var design = require('./db/designs/adjustments');



/* 
 * An adjustment is a document that a user makes to adjust a field on another
 * document, for instance, a relationship's strength.
 *
 * {
 *   user: { _id: '1234' },
 *   adjusted: {
 *     doc: {
 *       _id: '4321',
 *       type: 'relationship'
 *     },
 *     field: {
 *       name: 'strength',
 *       by: 1
 *     }
 *   }
 * }
 */


var Adjustment = function Adjustment(id){
  if (!(this instanceof Adjustment)) return new Adjustment(id);
  if (id) { this.id = id; }
  this.type = 'adjustment';
  this.tmp = {};
}


// Adjustment inherits from Doc.
util.inherits(Adjustment, Doc);


Adjustment.prototype.validate = function validateAdjustment(callback){
  var self = this;

  try {
    design.validate_doc_update(self.tmp.doc_body, self.tmp.old_doc_body);
  } catch (validation_error){
    return callback(validation_error, null);
  }

  var user = new Doc(self.tmp.doc_body.user._id);
  var adjusted = new Doc(self.tmp.doc_body.adjusted.doc._id);

  async.parallel([
    function(parallel_callback){
      user.exists(function(error, exists){
        if (error) return parallel_error(error, null);
        return parallel_callback(null, { user_exists: true });
      });
    },
    function(parallel_callback){
      adjusted.exists(function(error, exists){
        if (error) return parallel_error(error, null);
        return parallel_callback(null, { adjusted_exists: true });
      });
    }
  ], function(parallel_error, parallel_result){
    if (parallel_error) return callback(parallel_error);

    return Adjustment.super_.prototype.validate.call(self, callback);
  });
}


Adjustment.prototype.create = function createAdjustment(
  doc_body,
  callback
){
  var self = this;

  doc_body.creation_date = (new Date()).getTime();
  Adjustment.super_.prototype.create.call(self, doc_body, callback);
}



module.exports = Adjustment;
