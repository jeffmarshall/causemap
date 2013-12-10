var follow = require('follow');
var config = require('../config');
var settings = require('./settings');
var update = require('./update');
var es = require('./client');



var db_configs = config.get('couchdb');
var es_configs = config.get('elasticsearch');
var db_uri = [db_configs.host, '/', db_configs.database].join('');
var index_settings = settings('settings');


// This feed may emit some things:
// - error: the error and the input.
// - updated: the document that was handled.
// - deleted: the document that was deleted.
// - message: some kind of message.

var feed = new follow.Feed({
  db: db_uri,
  include_docs: true,
  filter: function(doc, req){
    if (
      doc._deleted || 
      [
        'situation',
        'relationship',
        'change',
        'adjustment',
        'bookmark'
      ].indexOf(
        doc.type
      ) > -1
    ){
      return true
    }

    return false;
  }
});


feed.on('change', function(change){
  var self = this;
  var doc = change.doc;

  var get_bulk_ops;

  if (doc._deleted){
    get_bulk_ops = update.deleted;
  } else {
    switch(doc.type){
      case 'bookmark': get_bulk_ops = update.bookmark; break; 
      case 'adjustment': get_bulk_ops = update.adjustment; break; 
      case 'change': get_bulk_ops = update.change; break; 
      case 'situation': get_bulk_ops = update.situation; break; 
      case 'relationship': get_bulk_ops = update.relationship; break; 
    }
  }

  function updateLastUpdateSettingAndContinue(){
    index_settings.set(
      'last_update_seq', 
      change.seq, 
      function(settings_error){
        if(settings_error){
          return feed.emit('error', settings_error);
        }

        self.resume();
      }
    );
  }

  self.pause();

  get_bulk_ops(doc, function(ops_error, bulk_ops){
    if(ops_error) return feed.emit('error', ops_error, doc);

    if(!bulk_ops.length){
      return updateLastUpdateSettingAndContinue();
    }

    return es().bulk(bulk_ops, function(bulk_error, bulk_result){
      if (bulk_error) return feed.emit('error', bulk_error, bulk_ops);
      if (doc._deleted) feed.emit('deleted', doc);
      else feed.emit('updated', doc);
      return updateLastUpdateSettingAndContinue();
    });
  });
});


feed.initialize = function(callback){
  var callback = callback || function(){};
  index_settings.get(
    'last_update_seq', 
    function(settings_error, last_update_seq){
      if (settings_error) return callback(settings_error, null);

      feed.since = last_update_seq || 0;
      feed.emit('message', 'last_update_seq: '+ feed.since);
      feed.initialized = true;
      feed.emit('initialized');

      return callback(null, { last_update: last_update_seq })
    }
  )
}


/* emits the following:
 *
 * - error
 * - deleted
 * - updated
 * - initialized
 * - message
 */
module.exports = feed;
