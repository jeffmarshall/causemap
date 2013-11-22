var follow = require('follow');
var config = require('../config');
var settings = require('./settings');
var update = require('./update');
var es = require('./client');



var db_settings = config.get('couchdb');
var db_uri = [db_settings.host, '/', db_settings.database].join('');
var es_cartography_settings = settings('cartography');

var feed = new follow.Feed({
  db: db_uri,
  include_docs: true,
  filter: function(doc, req){
    if (
      doc._deleted || 
      ['situation', 'relationship', 'change', 'adjustment'].indexOf(
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
      case 'adjustment': get_bulk_ops = update.adjustment; break; 
      case 'change': get_bulk_ops = update.change; break; 
      case 'situation': get_bulk_ops = update.situation; break; 
      case 'relationship': get_bulk_ops = update.relationship; break; 
    }
  }

  function updateLastUpdateSettingAndContinue(){
    es_cartography_settings.set(
      'last_update_seq', 
      change.seq, 
      function(settings_error){
        if(settings_error){
          return console.error('settings error:', settings_error)
        }

        self.resume();
      }
    );
  }

  self.pause();

  get_bulk_ops(doc, function(ops_error, bulk_ops){
    if(ops_error){ return console.error('ops error:', ops_error) }
    if(!bulk_ops.length){
      console.log('nothing to do:', change.id, change.seq);
      return updateLastUpdateSettingAndContinue();
    }

    return es().bulk(bulk_ops, function(bulk_error, bulk_result){
      if (bulk_error){ return console.error('bulk error:', bulk_error, bulk_ops) }
      if (doc._deleted) console.log('deleted:', doc._id);
      else console.log('updated:', doc.type, doc._id);
      return updateLastUpdateSettingAndContinue();
    });
  });
});


module.exports = function syncChanges(){
  es_cartography_settings.get(
    'last_update_seq', 
    function(settings_error, last_update_seq){
      feed.since = last_update_seq || 0;
      console.log('last_update_seq:', feed.since);
      feed.follow();
    }
  );
}
