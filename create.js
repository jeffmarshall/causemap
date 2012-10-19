var ops = require('./ops');
var utils = require('./utils');
var fetch = require('./fetch');


// TODO there needs to be some checking done before creating changes or
// relations, `change.changed` needs to return something that exists. The
// same goes for `relation.cause and `relation.effect`.



function createChange(properties, callback){
  // Properties:
  //
  // {
  //   changed: {_id: ..., type: ...},
  //   field_name: <string>,
  //   changed_from: <old field value>,
  //   changed_to: <new field value>,
  //   reason: <reason for making the change> (optional)
  // }

  var callback = callback || function(){};
  var change = {
    type: 'change',
    creation_date: new Date(),
    changed: {
      _id: properties.changed._id,
      type: properties.changed.type
    },
    field: properties.field_name,
    forward: properties.changed_to,
    backward: properties.changed_from,
  }

  if (properties.reason) change.reason = properties.reason;

  ops.insert(change, callback);
}


function createSituation(properties, callback){
  // Properties:
  //
  // {
  //   title: <string>
  // }

  var title = properties.title;
  var callback = callback || function(){};

  var situation = {
    title: title,
    type: 'situation',
    creation_date: new Date()
  }

  var slugified_title = utils.slugify(title);

  fetch.situation(slugified_title, function(fetch_error){
    if (fetch_error && fetch_error.error === 'not_found'){
      situation.slug = slugified_title;
    }

    ops.insert(situation, function(insert_error, insert_result){
      if (insert_error){
        return callback(insert_error, null);
      }

      createChange({
          changed: {_id: insert_result.id, type: 'situation'},
          field_name: 'creation_date',
          changed_from: undefined, 
          changed_to: situation.creation_date
        },
        function(create_change_error, create_change_result){
          if (create_change_error){
            return callback(create_change_error, null);
          }

          var creation_result = {
            ok: true,
            id: insert_result.id,
            change: create_change_result.id
          }

          if (situation.slug) creation_result.slug = situation.slug;

          return callback(null, creation_result);
        }
      );
    });
  });
}



function createRelation(properties, callback){
  // Properties
  //
  // {
  //   cause_id: <string> (situation id),
  //   effect_id: <string> (situation id)
  // }

  var cause_id = properties.cause;
  var effect_id = properties.effect;

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

    createChange({
        changed: {_id: insert_result.id, type: 'relation'},
        field_name: 'creation_date',
        changed_from: undefined,
        changed_to: relation.creation_date
      },
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
