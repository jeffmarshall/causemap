var util = require('util');
var _ = require('lodash');
var async = require('async');
var cartography = require('cartography');
var config = require('../config');
var Doc = require('./doc');
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



Situation.prototype.popularity = function scoreSituationPopularity(callback){
  var self = this;
  var creation_date;
  var total_changes = 0;
  var total_bookmarks = 0;

  async.parallel([
    function(parallel_callback){
      var doc = new Doc(self.id);

      doc.read(function(read_error, doc){
        if (read_error) return parallel_callback(read_error, null);
        creation_date = new Date(doc.creation_date);
        return parallel_callback(null, { read: true });
      })
    },

    function(parallel_callback){
      var view_options = {
        startkey: [ self.id ],
        endkey: [ self.id, {} ]
      }

      db().view(
        'bookmarks', 
        'by_bookmarked', 
        view_options, 
        function(view_error, view_results){
          if (view_error) return parallel_callback(view_error, null);

          if (view_results.length){
            total_bookmarks = view_results.rows[0].value;
          }

          return parallel_callback(null, { read_bookmarks: true });
        }
      );
    },

    function(parallel_callback){
      var view_options = {
        startkey: [ self.id ],
        endkey: [ self.id, {} ]
      }

      db().view(
        'cm-changes', 
        'by_changed', 
        view_options, 
        function(view_error, view_results){
          if (view_error) return parallel_callback(view_error, null);
          if (view_results.rows.length){
            total_changes = view_results.rows[0].value;
          }

          return parallel_callback(null, { read_changes: true });
        }
      );
    }
  ], function(parallel_error, parallel_result){
    /* 
     * This score calculation is similar to the one used by Hacker News:
     *
     * http://amix.dk/blog/post/19574
     *
     * The popularity of a situation decays by the hour. The gravity
     * variable determines how quickly something decays.
     *
     * TODO: There should be some way to factor views into this
     * calculation.
     */

    var now = new Date();
    var diff_in_ms = now - creation_date;
    var hours_since_creation = Math.floor(diff_in_ms /1000 /60 /60 );
    var popularity_gravity = config.get('popularity_gravity') || 1.8;
    var base_popularity = (total_changes *0.6) + total_bookmarks +1;
    var rate_of_decay = Math.pow(
      hours_since_creation +2,
      popularity_gravity
    );

    var popularity = base_popularity / rate_of_decay;

    return callback(null, popularity);
  });
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

