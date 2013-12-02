var util = require('util');
var async = require('async');
var auth = require('auth');

var Bookmark = require('./bookmark');
var Adjustment = require('./adjustment');

var db = require('./db').db;





var User = function User(id){
  if (!(this instanceof User)) return new User(id);
  if (id) { this.id = id; }
  this.type = 'user';
}



util.inherits(User, auth.models.User);



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
