var util = require('util');
var _ = require('lodash');
var async = require('async');
var cartography = require('cartography');
var Bookmark = require('./bookmark');

var db = require('./db').db;





var Situation = function Situation(id){
  if (!(this instanceof Situation)) return new Situation(id);
  if (id) { this.id = id; }
  this.type = 'situation';
}

util.inherits(Situation, cartography.models.Situation);



Situation.prototype.bookmarks = function totalBookmarksForSituation(
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



Situation.prototype.delete = function deleteSituation(callback){
  var self = this;

  // delete bookmarks
  self.bookmarks(function(error, result){
    if (error) return callback(error, null);

    db().bulk({ docs: result.map(function(doc){
      doc._deleted = true;
      return doc;
    }) }, function(bulk_error, bulk_delete){
      if (bulk_error) return callback(bulk_error, null);
      Situation.super_.prototype.delete.call(self, callback);
    })
  })
}





module.exports = Situation;
