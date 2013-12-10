#!/usr/local/bin/node

var async = require('async');
var _ = require('lodash');
var cm = require('./');

var nano = require('./models/db').nano();
var search_client = require('./search').client();
var config = require('./config');
var install = require('./install');

var configs = config.get();



var parallel_ops = [
  // destroy db
  function(cb){
    nano.db.destroy(configs.couchdb.database, function(error, res){
      if (error){
        if (error.reason == 'missing'){
          return cb(null, null);
        }

        return cb(error, null);
      }

      return cb(null, res);
    })
  },
  function(cb){
    search_client.indexExists('settings', function(error, result){
      if (error) return cb(error, null);
      if (result){
        return search_client.deleteIndex('settings', cb);
      }

      return cb(null, null);
    })
  }
]

var indexes = config.get('elasticsearch').indexes;

Object.keys(indexes).forEach(function(index){
  var index_name = indexes[index];
  parallel_ops.push(function(cb){
    search_client.indexExists(index_name, function(error, result){
      if (error) return cb(error, null);
      if (result){
        return search_client.deleteIndex(index_name, cb);
      }

      return cb(null, null);
    });
  });
})

async.parallel(parallel_ops, function(err, res){
  if (err) return console.error(err);
  console.log(res);
  install(console.log)
});
