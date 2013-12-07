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



Situation.prototype.controversiality = function scoreSituationControversiality(
  callback
){
  var self = this;
  var creation_date;
  var total_changes = 0;

  async.parallel([
    function(parallel_callback){
      var doc = new Doc(self.id);
      doc.read(function(read_error, doc_body){
        if (read_error) return parallel_callback(read_error, null);
        creation_date = new Date(doc_body.creation_date);
        return parallel_callback(null, { read: true });
      });
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
          if (view_error) return parallel_error(view_error, null);
          if (view_results.rows.length){
            total_changes = view_results.rows[0].value;
          }

          return parallel_callback(null, { read_changes: true });
        }
      );
    }
  ], function(parallel_error, parallel_result){
    if (parallel_error) return callback(parallel_error, null);

    /*
     * This rating is calculated the same way as the popularity rating below.
     * Both use the calculation used by Hacker News.
     */

    var now = new Date();
    var diff_in_ms = now - creation_date;
    var hours_since_creation = Math.floor(diff_in_ms /1000 /60 /60 );
    var controversiality_gravity = config.get(
      'controversiality_gravity'
    ) || 1.8;

    var base_controversiality = total_changes;
    var rate_of_decay = Math.pow(
      hours_since_creation +2,
      controversiality_gravity
    );

    var controversiality = base_controversiality / rate_of_decay;

    return callback(null, controversiality);
  });
}







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


Situation.prototype.actions = function situationActions(callback){
  var self = this;

  var view_options = {
    include_docs: true,
    startkey: [ self.id ],
    endkey: [ self.id, {} ],
    reduce: false
  }

  db().view(
    'actions',
    'by_subject',
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

  async.parallel([
    function(parallel_callback){
      // delete bookmarks
      self.bookmarks(function(error, result){
        if (error) return parallel_callback(error, null);

        db().bulk({ docs: result.map(function(doc){
          doc._deleted = true;
          return doc;
        }) }, function(bulk_error, bulk_delete){
          if (bulk_error) return parallel_callback(bulk_error, null);
          return parallel_callback(null, { bookmarks_deleted: true });
        })
      })
    },
    
    function(parallel_callback){
      // delete actions
      self.actions(function(error, actions){
        if (error) return parallel_callback(error, null);
        
        db().bulk({ docs: actions.map(function(doc){
          doc._deleted = true;
          return doc;
        }) }, function(bulk_error, bulk_result){
          if (bulk_error) return parallel_callback(bulk_error, null);
          return parallel_callback(null, { actions_deleted: true });
        })
      });
    },

    function(parallel_callback){
      // delete actions for changes
      // TODO: find some way to do this for a change when it's deleted or
      // something.

      self.changes(function(error, changes){
        if (error) return parallel_callback(error, null);

        var action_ids = changes.map(function(change){
          return ['created', change._id].join(':');
        })

        db().fetch({ keys: action_ids }, function(error, view_result){
          if (error) return parallel_callback(error, null);
          var docs = view_result.rows.map(function(row){
            row.doc._deleted = true;
            return row.doc;
          });

          db().bulk({ docs: docs }, function(error, bulk_result){
            if (error) return parallel_callback(error, null);
            return parallel_callback(
              null,
              { actions_for_changes_deleted: true}
            );
          })
        });
      })
    }
  ], function(parallel_error, parallel_result){
    if (parallel_error) return callback(parallel_error, null);
    return Situation.super_.prototype.delete.call(self, callback);
  });
}





module.exports = Situation;

