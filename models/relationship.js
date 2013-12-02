var util = require('util');
var _ = require('lodash');
var async = require('async');
var cartography = require('cartography');
var Bookmark = require('./bookmark');

var db = require('./db').db;





var Relationship = function Relationship(id){
  if (!(this instanceof Relationship)) return new Relationship(id);
  if (id) { this.id = id; }
  this.type = 'relationship';
}

util.inherits(Relationship, cartography.models.Relationship);



Relationship.prototype.bookmarks = function totalBookmarksForRelationship(
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
    'by_bookmarked',
    view_options,
    function(view_error, view_result){
      if (view_error) return callback(view_error, null);
      return callback(null, view_result.rows.map(
        function(row){ return row.doc }
      ))
    }
  )
}



Relationship.prototype.delete = function deleteRelationship(callback){
  var self = this;

  // delete bookmarks
  self.bookmarks(function(error, result){
    if (error) return callback(error, null);

    db().bulk({ docs: result.map(function(doc){
      doc._deleted = true;
      return doc;
    }) }, function(bulk_error, bulk_delete){
      if (bulk_error) return callback(bulk_error, null);
      Relationship.super_.prototype.delete.call(self, callback);
    })
  })
}





module.exports = Relationship;
