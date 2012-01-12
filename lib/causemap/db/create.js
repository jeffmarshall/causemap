var designs = require('./designs');



function createDatabases(client, callback){
  var dbs_processed = 0;
  var total_dbs = 0;

  for (key in designs){
    total_dbs += 1;
  }

  function readyCheck(){
    return dbs_processed == total_dbs;
  }

  function go(){
    callback(null, {ok: true});
  }


  function dbExistanceCallback(db){
    return function(err, exists){
      if (err){
        callback(err, null);
        return;
      }

      if (exists){
        dbs_processed += 1;
        if (readyCheck()) go();
      } else {
        db.create(dbCreationCallback(db));
      }
    }
  }


  function dbCreationCallback(db){
    return function(err, res){
      if (err || res.error){
        callback(err || res.error);
        return;
      }

      dbs_processed += 1;
      if (readyCheck()) go();
    }
  }


  for (db_design_name in designs){
    var db_design = designs[db_design_name];
    var db = client.db(db_design.db_name);

    db.exists(dbExistanceCallback(db));
  }
}



function saveDesigns(db, designs_to_save, callback){
  var designs_saved = 0;
  var total_designs_to_save = 0;

  for (key in designs_to_save){
    total_designs_to_save += 1;
  }

  function readyCheck(){
    return designs_saved == total_designs_to_save;
  }

  function go(){
    callback(null, {ok: true});
    return;
  }


  function savedDesignCallback(){
    return function(err, res){
      if (err || res.error){
        callback(err, res);
        return;
      }

      designs_saved += 1;
      if (readyCheck()) go();
    }
  }


  for (design_name in designs_to_save){
    var design = designs_to_save[design_name];
    db.saveDesign(design_name, design, savedDesignCallback());
  }
}



function createEverything(client, callback){

  var db_designs_processed = 0;
  var total_db_designs = 0;

  for (key in designs){
    total_db_designs += 1;
  }


  function readyCheck(){
    return db_designs_processed == total_db_designs;
  }

  function go() {
    callback(null, {ok: true});
    return;
  }


  function savedDesignsCallback(db){
    return function(err, res){
      if (err || res.error){
        // TODO this isn't good. I should check to see that the designs don't
        // exist yet, instead of ignoring the conflict error.
        if (err.error != 'conflict'){
          callback(err, res);
          return;
        }
      }

      db_designs_processed += 1;
      if (readyCheck()) go();
    }
  }

  function getDesignsForDb(db){
    var designs_to_save;

    for (db_design_name in designs){
      var design = designs[db_design_name];
      if (design.db_name == db.name){
        designs_to_save = design.designs;
      }
    }

    return designs_to_save;
  }

  function dbExistanceCallback(db){

    return function(err, exists){
      if (err){
        callback(err, null);
        return;
      }

      if (exists) {
        // Go ahead and save the design documents
        var designs_to_save = getDesignsForDb(db);
        saveDesigns(db, designs_to_save, savedDesignsCallback(db));
      } else {
        db.create(dbCreationCallback(db));
      }
    }
  }


  function dbCreationCallback(db){
    return function(err, res){
      if (err || res.error) {
        callback(err, res);
        return;
      }

      var designs_to_save = getDesignsForDb(db);

      saveDesigns(db, designs_to_save, savedDesignsCallback(db));
    }
  }



  for (db_design_name in designs) {
    var db_design = designs[db_design_name];
    var db = client.db(db_design.db_name);

    // Check if the db exists
    db.exists(dbExistanceCallback(db));
  }

}


module.exports = {
  databases: createDatabases,
  designs: saveDesigns,
  everything: createEverything
}
