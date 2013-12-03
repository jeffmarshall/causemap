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



Relationship.prototype.adjustments = function adjustmentsForRelationship(
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
    'adjustments',
    'by_adjusted_field',
    view_options,
    function(view_error, view_result){
      if (view_error) return callback(view_error, null);
      return callback(null, view_result.rows.map(
        function(row){ return row.doc }
      ))
    }
  )
}



Relationship.prototype.strength = function getRelationshipStrength(callback){
  var self = this;

  var view_options = {
    startkey: [ self.id, 'strength' ],
    endkey: [ self.id, 'strength', {} ]
  }

  db().view(
    'adjustments',
    'by_adjusted_field',
    view_options,
    function(error, view_result){
      if (error) return callback(error, null);
      if (!view_result.rows.length) return callback(null, 0);
      return callback(null, view_result.rows[0].value)
    }
  );
}



Relationship.prototype.summarize = function summarizeRelationship(callback){
  var self = this;

  async.parallel([
    function(parallel_callback){
      Relationship.super_.prototype.summarize.call(self, parallel_callback);
    },

    function(parallel_callback){
      self.strength(function(error, strength_rating){
        if (error) return parallel_callback(error, null);
        return parallel_callback(null, { strength: strength_rating });
      });
    }
  ], function(parallel_error, parallel_results){
    if (parallel_error) return callback(parallel_error, null);

    var summary = {};

    parallel_results.forEach(function(parallel_result){
      summary = _.extend(summary, parallel_result);
    });

    return callback(null, summary);
  });
}



Relationship.prototype.delete = function deleteRelationship(callback){
  var self = this;

  async.parallel([
    function(parallel_callback){
      // delete bookmarks
      self.bookmarks(function(error, result){
        if (error) return parallel_callback(error, null);

        db().bulk({ docs: result.map(function(doc){
          doc._deleted = true;
          return doc;
        }) }, function(bulk_error, bulk_result){
          if (bulk_error) return callback(bulk_error, null);
          return parallel_callback(null, bulk_result);
        })
      })
    },

    function(parallel_callback){
      // delete adjustments
      self.adjustments(function(error, docs){
        if (error) return parallel_callback(error, null);
        return db().bulk({ docs: docs.map(function(doc){
          doc._deleted = true;
          return doc;
        }) }, function(bulk_error, bulk_result){
          if (bulk_error) return parallel_callback(bulk_error, null);
          return parallel_callback(null, bulk_result)
        });
      });
    }
  ], function(parallel_error, parallel_result){
    if (parallel_error) return callback(parallel_error, null);
    return Relationship.super_.prototype.delete.call(self, callback);
  });
}





module.exports = Relationship;
