var util = require('util');
var async = require('async');
var auth = require('auth');
var cartography = require('cartography');

var Change = cartography.models.Change;
var Action = require('../action');
var Bookmark = require('../bookmark');
var Adjustment = require('../adjustment');

var db = require('../db').db;





var User = function User(id){
  if (!(this instanceof User)) return new User(id);
  if (id) { this.id = id; }
  this.type = 'user';
}



util.inherits(User, auth.models.User);



User.prototype._change = function(key, model_instance, value, callback){
  var self = this;

  model_instance[key](value, function(error, model_instance_result){
    if (error) return callback(error, null);

    var new_action = new Action([
      'created', 
      model_instance_result.id
    ].join(':'))

    new_action.create({
      user: { _id: self.id },
      verb: 'created',
      subject: {
        _id: model_instance.id,
        type: model_instance.type
      }
    }, function(error, action_result){
      if (error){
        var change = new Change(model_instance_result.id);
        change.delete(function(){});
        return callback(error, null);
      }

      return callback(null, model_instance_result)
    })
  })
}



User.prototype.bookmark = function createBookmarkForUser(bookmarked, callback){
  var self = this;
  var bookmarked_id = bookmarked.id || bookmarked._id;

  var new_bookmark = new Bookmark([
    self.id,
    'bookmarked',
    bookmarked_id
  ].join(':'));

  return new_bookmark.create({
    user: { _id: self.id },
    bookmarked: {
      _id: bookmarked_id,
      type: bookmarked.type
    }
  }, callback)
}



User.prototype.unbookmark = function deleteBookmarkForUser(
  bookmarked, 
  callback
){
  var self = this;
  var bookmarked_id = bookmarked.id || bookmarked._id;

  var bookmark = new Bookmark([
    self.id,
    'bookmarked',
    bookmarked_id
  ].join(':'));

  return bookmark.delete(callback)
}



User.prototype.bookmarks = function bookmarksByUser(
  callback
){
  var self = this;

  var view_options = {
    include_docs: true,
    startkey: [ self.id ],
    endkey: [ self.id, {} ],
    reduce: false
  }

  db().view(
    'bookmarks',
    'by_user',
    view_options,
    function(view_error, view_result){
      if (view_error) return callback(view_error, null);
      return callback(null, view_result.rows.map(
        function(row){ return row.doc }
      ))
    }
  )
}



function adjustRelationshipStrength(
  user_id, 
  relationship_id, 
  amount, 
  callback
){
  var adjustment = new Adjustment([
    user_id,
    'adjusted',
    relationship_id,
    'strength'
  ].join(':'));

  adjustment.exists(function(error, doc){
    if (error){
      if (error.status_code == 404) {
        return adjustment.create({
          user: { _id: user_id },
          adjusted: {
            doc: {
              _id: relationship_id,
              type: 'relationship'
            },
            field: {
              name: 'strength',
              by: amount
            }
          }
        }, callback)
      }

      return callback(error, null);
    }

    return adjustment.update(function(adjustment_doc){
      if (adjustment_doc.adjusted.field.by == amount){
        throw {
          error: 'already_adjusted', 
          message: "This adjustment has already been made."
        }
      }

      adjustment_doc.adjusted.field.by = amount;

      return adjustment_doc;
    }, callback);
  })
};


User.prototype.strengthen = function(relationship, callback){
  return adjustRelationshipStrength(this.id, relationship.id, 1, callback);
};


User.prototype.weaken = function(relationship, callback){
  return adjustRelationshipStrength(this.id, relationship.id, -1, callback);
};


User.prototype.unstrength = function(relationship, callback){
  var self = this;

  var adjustment = new Adjustment([
    self.id,
    'adjusted',
    relationship.id,
    'strength'
  ].join(':'));

  return adjustment.delete(callback);
}


User.prototype.adjustments = function userAdjustments(callback){
  var self = this;

  var view_options = {
    include_docs: true,
    startkey: [ self.id ],
    endkey: [ self.id, {} ],
    reduce: false
  }

  db().view(
    'adjustments',
    'by_user',
    view_options,
    function(view_error, view_result){
      if (view_error) return callback(view_error, null);
      return callback(null, view_result.rows.map(
        function(row){ return row.doc }
      ))
    }
  )
}


User.prototype.actions = function userActions(callback){
  var self = this;

  var view_options = {
    include_docs: true,
    startkey: [ self.id ],
    endkey: [ self.id, {} ],
    reduce: false
  }

  db().view(
    'actions',
    'by_user_verb_and_doc',
    view_options,
    function(view_error, view_result){
      if (view_error) return callback(view_error, null);
      return callback(null, view_result.rows.map(
        function(row){ return row.doc }
      ))
    }
  )
}


User.prototype.delete = function deleteUser(callback){
  var self = this;

  async.parallel([
    function(parallel_callback){
      // delete bookmarks
      self.bookmarks(function(error, result){
        if (error) return parallel_callback(error, null);

        db().bulk({ docs: result.map(function(doc){
          doc._deleted = true;
          return doc;
        }) }, function(bulk_error, bulk_delete){
          if (bulk_error) return callback(bulk_error, null);
          return parallel_callback(null, bulk_delete);
        })
      })
    },

    function(parallel_callback){
      // delete adjustments
      self.adjustments(function(error, adjustments){
        if (error) return parallel_callback(error, null);
        
        db().bulk({ docs: adjustments.map(function(doc){
          doc._deleted = true;
          return doc;
        }) }, parallel_callback)
      });
    }
  ], function(parallel_error, parallel_result){
    if (parallel_error) return callback(parallel_error, null);
    return User.super_.prototype.delete.call(self, callback);
  })
}





module.exports = User;

require('./situations');
