var async = require('async');





function installCausemap(callback){
  var config = require('./config');
  var db_module = require('./models/db');
  var designs = require('./models/db/designs');
  var installIndexes = require('./search/indexes/install');

  var nano = db_module.nano();
  var db = db_module.db();
  var db_name = config.get('couchdb').database;

  async.parallel([
    function(parallel_callback){
      async.series([
        // Create the database if it doesn't exist:
        function(series_callback){
          nano.db.get(db_name, function(get_error, result){
            if (!get_error) {
              return series_callback(null, {
                db_exists: result 
              })
            }

            if (get_error.status_code === 404){
              return nano.db.create(db_name, function(
                creation_error, creation_result
              ){
                if (creation_error){
                  if (creation_error.error == "file_exists"){
                    return series_callback(null, null);
                  }

                  return series_callback(creation_error, null);
                }

                return series_callback(null, {
                  db_created: creation_result
                });
              });
            }

            return series_callback(get_error, null);
          });
        },

        // Insert design documents
        function(series_callback){
          var design_docs = [];
          for (design_name in designs) design_docs.push(designs[design_name]);
          db.bulk({ docs: design_docs }, series_callback);
        }
      ], parallel_callback)
    },
    installIndexes
  ], callback);
}


function install(callback){
  var auth = require('auth');
  var cartography = require('cartography');

  async.parallel([
    cartography.install,
    auth.install,
    installCausemap
  ], callback);
}



module.exports = install;
