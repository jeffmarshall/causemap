var couchdb = require('felix-couchdb');



var DB_NAMES = [
  'situations',
  'relations'
]



module.exports.everything = function(client, callback){

  var completed_removals = 0;

  function readyCheck(){
    return completed_removals == DB_NAMES.length;
  }

  function go(){
    callback(null, {ok: true});
  }

  function makeExistanceCallback(db){
    return function(err, exists){
      if (exists){
        db.remove(function(err, res){
          if (res.ok){
            completed_removals += 1;
            if (readyCheck()) go();
          }
        });
      }
    }
  }

  for (i in DB_NAMES){

    var db_name = DB_NAMES[i];
    var db = client.db(db_name);

    db.exists(makeExistanceCallback(db));
  }
}
