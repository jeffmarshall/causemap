var _ = require('underscore');
var ops = require('./ops');
var create = require('./create');
var fetch = require('./fetch');
var errors = require('./errors');



// TODO:
// - throw errors when the arguments are wrong


function modifyField(args, callback){
  // Arguments:
  //
  // {
  //   doc_id: <string>,
  //   field_name: <string>,
  //   value: <js>,
  //   reason: <string> (optional),
  //   generate_change_object: <bool> (optional)
  // }

  // unpacking args
  var doc_id = args.doc_id;
  var field_name = args.field_name;
  var value = args.value;
  var reason = args.reason;
  var generate_change_object = args.generate_change_object || true;

  var callback = callback || function(){};
  var old_value = null;
  var doc_type = null

  function operation(doc){
    old_value = _.clone(doc[field_name]);
    doc_type = doc.type;

    doc[field_name] = value;
    return doc;
  }

  ops.atomic(doc_id, operation, function(operation_error, operation_result){
    if (operation_error){
      return callback(operation_error, null);
    }

    // field successfully modified

    if (generate_change_object){
      create.change({
          changed: {_id: doc_id, type: doc_type},
          field_name: field_name,
          changed_from: old_value,
          changed_to: value,
          reason: reason
        },
        function(create_change_error, create_change_result){
          if (create_change_error){
            return callback(create_change_error, null);
          }

          return callback(null, {
            ok: true,
            id: doc_id,
            change: create_change_result.id
          });
        }
      );
    } else {
      return callback(null, {
        ok: true,
        id: doc_id,
      });
    }
  });
}


function modifySituationTags(args, callback){
  // Args:
  // {
  //   situation_id: <string>,
  //   tag|untag: <string>,
  //   reason: <string>
  // }

  // unpack args
  var situation_id = args.situation_id;
  
  if (args.tag){
    var action = 'add';
    var tag = arg.tag;
  } else if (args.untag){
    var action = 'remove';
    var tag = arg.untag;
  } else {
    return callback({
      error: "argument_error",
      message: "arguments must contain either 'tag' or 'untag'"
    },null);
  }

  var reason = args.reason;

  var callback = callback || function(){};
  var old_tags = null;

  function addTag(situation){
    old_tags = _.clone(situation.tags);
    var tags = situation.tags;

    if (_.isArray(tags) && tags.indexOf(tag) != -1){
      throw errors.alreadyTagged(tag);
    }

    if (!_.isArray(tags)){
      tags = [];
    }

    tags.push(tag);
    situation.tags = tags;

    return situation
  }

  function removeTag(situation){
    old_tags = _.clone(situation.tags);
    var tags = situation.tags;

    var tag_position = tags.indexOf(tag);

    if (!_.isArray(tags) || tag_position === -1){
      throw errors.notTagged(tag);
    }

    tags.splice(tag_position, 1);
    situation.tags = tags;

    if (tags.length === 0){
      delete situation.tags;
    }

    return situation;
  }

  // TODO: the duties of this block can be handled earlier
  switch(action){
    case 'add': var operation = addTag; break;
    case 'remove': var operation = removeTag; break;
  }

  ops.atomic(situation_id, operation, function(operation_error, situation){
    if (operation_error){
      return callback(operation_error, null);
    }

    create.change({
        changed: {_id: situation_id, type: 'situation'},
        field_name: 'tags',
        changed_from: old_tags,
        changed_to: situation.tags,
        reason: reason
      },
      function(create_change_error, create_change_result){
        if (create_change_error){
          return callback(create_change_error, null);
        }

        return callback(null, {
          ok: true,
          id: situation_id, 
          change: create_change_result.id
        });
      }
    );
  });
}


function modifyDocumentMark(args, callback){
  // Args:
  //
  // {
  //   doc_id: <string>,
  //   mark|unmark: <string>,
  //   reason: <string> (optional)
  // }

  // unpacking args
  var doc_id = args.doc_id || args.situation_id || args.relation_id;

  if (args.mark){
    var action = 'mark';
    var mark_name = args.mark;
  } else if (args.unmark){
    var action = 'unmark';
    var mark_name = args.unmark;
  } else {
    return callback({
      error: "ArgumentError",
      message: "Argument object must contain either 'mark' or 'unmark' keys"
    }, null);
  }

  var reason = args.reason;

  var callback = callback || function(){};
  var old_marks = null;

  function mark(doc){
    old_marks = _.clone(doc.marked);

    if (doc.marked && doc.marked[mark_name]){
      throw error.alreadyMarked(mark_name);
    }

    if (doc.marked === undefined){
      doc.marked = {};
    }

    doc.marked[mark_name] = new Date();

    return doc;
  }

  function unmark(doc){
    old_marks = _.clone(doc.marked);

    if (doc.marked === undefined || doc.marked[mark_name] === undefined){
      throw errors.notMarked(mark_name);
    }

    delete doc.marked[mark_name];

    if (_.isEmpty(doc.marked)){
      delete doc.marked;
    }

    return doc
  }

  // TODO: the duties of this block should be handled earlier
  switch(action){
    case 'mark': var operation = mark; break;
    case 'unmark': var operation = unmark; break;
  }

  ops.atomic(doc_id, operation, function(operation_error, marked_doc){
    if (operation_error){
      return callback(operation_error, null);
    }

    create.change({
        changed: {_id: doc_id, type: marked_doc.type},
        field_name: 'marked',
        changed_from: old_marks,
        changed_to: marked_doc.marked,
        reason: reason
      },
      function(create_change_error, create_change_result){
        if (create_change_error){
          return callback(create_change_error, null);
        }

        return callback(null, {
          ok: true,
          id: doc_id, 
          change: create_change_result.id
        });
      }
    );
  });
}


function modifyRelationStrength(args, callback){
  // Args:
  //
  // {
  //   strengthen|weaken: <string> (relation_id)
  // }
  
  if (args.strengthen){
    var relation_id = args.strengthen;
    var action = 'strengthen';
  } else if (args.weaken){
    var relation_id = args.weaken;
    var action = 'weaken';
  } else {
    return callback({
      error: "ArgumentError",
      message: "Args must contain either 'strengthen' or 'weaken'"
    }, null);
  }

  var callback = callback || function(){};

  function strengthen(relation){
    relation.strength += 1;
    return relation;
  }

  function weaken(relation){
    relation.strength -= 1;
    return relation;
  }

  var operation;

  switch(action){
    case 'strengthen' : operation = strengthen; break;
    case 'weaken' : operation = weaken; break;
    default : throw {error: 'argument_error', message: 'Invalid action.'};
  }

  ops.atomic(relation_id, operation, function(atomic_err, atomic_result){
    if (atomic_err){
      return callback(atomic_err, null);
    }

    return callback(null, {
      ok: true,
      id: doc_id, 
    });
  });
}


function modifySituationTitle(args, callback){
  // Args:
  //
  // {
  //   situation_id: <string>,
  //   title: <string>,
  //   reason: <string> (optional)
  // }

  var callback = callback || function(){};

  modifyField({
    doc_id: args.situation_id,
    field_name: 'title',
    value: args.title,
    reason: args.reason
  }, callback);
}

function modifySituationDescription(args, callback){
  // Args:
  //
  // {
  //   situation_id: <string>,
  //   description: <string>,
  //   reason: <string> (optional)
  // }

  var callback = callback || function(){};

  modifyField({
    doc_id: args.situation_id,
    field_name: 'description',
    value: args.description,
    reason: args.reason
  }, callback);
}

function modifySituationLocation(args, callback){
  // Args:
  //
  // {
  //   situation_id: <string>,
  //   location: <string>,
  //   reason: <string> (optional)
  // }

  var callback = callback || function(){};

  modifyField({
    doc_id: args.situation_id,
    field_name: 'location',
    value: args.location,
    reason: args.reason
  }, callback);
}

function modifySituationPeriod(args, callback){
  // Args:
  //
  // {
  //   situation_id: <string>,
  //   period: <string>,
  //   reason: <string> (optional)
  // }

  var callback = callback || function(){};

  modifyField({
    doc_id: args.situation_id,
    field_name: 'period',
    value: args.period,
    reason: args.reason
  }, callback);
}

function modifySituationSlug(args, callback){
  // Args:
  //
  // {
  //   situation_id: <string>,
  //   slug: <string>,
  //   reason: <string> (optional)
  // }

  var slug = args.slug;

  var callback = callback || function(){};

  fetch.situation(slug, function(fetch_error, situation){
    if (fetch_error || situation.moved){
      return modifyField({
        doc_id: args.situation_id,
        field_name: 'slug',
        value: args.slug,
        reason: args.reason
      }, callback);
    }

    callback(errors.slugInUse(slug), null);
  });
}

function modifyRelationDescription(args, callback){
  // Args:
  //
  // {
  //   relation_id: <string>,
  //   description: <string>,
  //   reason: <string> (optional)
  // }

  var callback = callback || function(){};

  modifyField({
    doc_id: args.relation_id,
    field_name: 'description',
    value: args.description,
    reason: args.reason
  }, callback);
}




module.exports = {
  situation: {
    title: modifySituationTitle,
    slug: modifySituationSlug,
    description: modifySituationDescription,
    location: modifySituationLocation,
    period: modifySituationPeriod,
    tags: modifySituationTags,
    mark: modifyDocumentMark
  },
  relation: {
    description: modifyRelationDescription,
    strength: modifyRelationStrength,
    mark: modifyDocumentMark
  }
}
