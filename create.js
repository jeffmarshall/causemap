var ops = require('./ops');


// TODO there needs to be some checking done before creating changes or
// relations, `change.changed` needs to return something that exists. The
// same goes for `relation.cause and `relation.effect`.



function createChange(changed, field_name, changed_from, changed_to, callback){
  var callback = callback || function(){};
  var change = {
    type: 'change',
    creation_date: new Date(),
    changed: {
      _id: changed._id,
      type: changed.type
    },
    field: field_name,
    forward: changed_to,
    backward: changed_from
  }

  ops.insert(change, callback);
}


function createSituation(title, callback){
  var callback = callback || function(){};

  var situation = {
    title: title,
    type: 'situation',
    creation_date: new Date()
  }

  ops.insert(situation, function(insert_error, insert_result){
    if (insert_error){
      return callback(insert_error, null);
    }

    createChange(
      {_id: insert_result.id, type: 'situation'},
      'creation_date',
      undefined, 
      situation.creation_date,
      function(create_change_error, create_change_result){
        if (create_change_error){
          return callback(create_change_error, null);
        }

        return callback(null, {
          ok: true,
          id: insert_result.id,
          change: create_change_result.id
        });
      }
    );
  });
}



function createRelation(cause_id, effect_id, callback){
  var callback = callback || function(){};
  
  var relation = {
    type: 'relation',
    creation_date: new Date(),
    cause: {
      _id: cause_id
    },
    effect: {
      _id: effect_id
    },
    strength: 0
  }

  ops.insert(relation, function(insert_error, insert_result){
    if (insert_error){
      return callback(insert_error);
    }

    createChange(
      {_id: insert_result.id, type: 'relation'},
      'creation_date',
      undefined,
      relation.creation_date,
      function(create_change_error, create_change_result){
        if (create_change_error){
          return callback(create_change_error, null);
        }

        callback(null, {
          ok: true,
          id: insert_result.id,
          change: create_change_result.id
        });
      }
    );
  });
}




module.exports = {
  situation: createSituation,
  relation: createRelation,
  change: createChange
}
