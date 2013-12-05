var util = require('util');
var async = require('async');

var Doc = require('./doc');
var design = require('./db/designs/actions');



/* 
 * An action is a document that is created when a user takes an action, for
 * instance, creating a situation:
 *
 * {
 *   user: { _id: '1234' },
 *   verb: 'created',
 *   subject: {
 *     _id: '3214',
 *     type: 'situation'
 *   }
 * }
 */


var Action = function Action(id){
  if (!(this instanceof Action)) return new Action(id);
  if (id) { this.id = id; }
  this.type = 'action';
  this.tmp = {};
}


// Action inherits from Doc.
util.inherits(Action, Doc);


Action.prototype.validate = function validateAction(callback){
  var self = this;

  try {
    design.validate_doc_update(self.tmp.doc_body, self.tmp.old_doc_body);
  } catch (validation_error){
    return callback(validation_error, null);
  }

  // TODO: when the verb is 'created', there should be some verification that
  // there isn't already an action that 'created' the same subject.

  var user = new Doc(self.tmp.doc_body.user._id);
  var subject = new Doc(self.tmp.doc_body.subject._id);

  async.parallel([
    function(parallel_callback){
      user.exists(function(error, exists){
        if (error) return parallel_error(error, null);
        return parallel_callback(null, { user_exists: true });
      });
    },
    function(parallel_callback){
      subject.read(function(error, subject_body){
        if (error) return parallel_error(error, null);
        self.tmp.doc_body.subject.type = subject_body.type;

        return parallel_callback(null, { subject_exists: true });
      });
    }
  ], function(parallel_error, parallel_result){
    if (parallel_error) return callback(parallel_error);

    return Action.super_.prototype.validate.call(self, callback);
  });
}


Action.prototype.create = function createAction(
  doc_body,
  callback
){
  var self = this;

  doc_body.creation_date = (new Date()).getTime();
  Action.super_.prototype.create.call(self, doc_body, callback);
}



module.exports = Action;
