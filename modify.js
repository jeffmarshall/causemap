var _ = require('underscore');
var ops = require('./ops');
var create = require('./create');
var fetch = require('./fetch');
var errors = require('./errors');




function modifyField(doc_id, field_name, value, callback){
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

    // field successfully modified, creating change.

    create.change(
      {_id: doc_id, type: doc_type},
      field_name,
      old_value,
      value,
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


function modifySituationTags(situation_id, action, tag, callback){
  var callback = callback || function(){};
  var old_tags = null;

  function addTag(situation){
    old_tags = _.clone(situation.tags);
    var tags = situation.tags;

    if (_.isArray(tags) && tags.indexOf(tag)){
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

  switch(action){
    case 'add': var operation = addTag; break;
    case 'remove': var operation = removeTag; break;
  }

  ops.atomic(situation_id, operation, function(operation_error, situation){
    if (operation_error){
      return callback(operation_error, null);
    }

    create.change(
      {_id: situation_id, type: 'situation'},
      'tags',
      old_tags,
      situation.tags,
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


function modifyDocumentMark(doc_id, action, mark_name, callback){
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

  switch(action){
    case 'mark': var operation = mark; break;
    case 'unmark': var operation = unmark; break;
  }

  ops.atomic(doc_id, operation, function(operation_error, marked_doc){
    if (operation_error){
      return callback(operation_error, null);
    }

    create.change(
      {_id: doc_id, type: marked_doc.type},
      'marked',
      old_marks,
      marked_doc.marked,
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


function markDocument(doc_id, mark_name, callback){
  var callback = callback || function(){};

  modifyDocumentMark(doc_id, 'mark', mark_name, callback);
}


function unmarkDocument(doc_id, mark_name, callback){
  var callback = callback || function(){};

  modifyDocumentMark(doc_id, 'unmark', mark_name, callback);
}


function modifyRelationStrength(relation_id, action, callback){
  var callback = callback || function(){};

  function strengthen(relation){
    relation.strength += 1;
  }

  function weaken(relation){
    relation.strength -= 1;
  }

  var operation;

  switch(action){
    case 'strengthen' : operation = strengthen; break;
    case 'weaken' : operation = weaken; break;
    default : throw {error: 'argument_error', message: 'Invalid action.'};
  }

  ops.atomic(relation_id, operation, callback);
}


function weakenRelation(relation_id, callback){
  var callback = callback || function(){};

  function weaken(relation){
    relation.strength -= 1;
  }

  ops.atomic(relation_id, weaken, callback);
}


function modifySituationTitle(situation_id, title, callback){
  var callback = callback || function(){};
  modifyField(situation_id, 'title', title, callback);
}

function modifySituationDescription(situation_id, description, callback){
  var callback = callback || function(){};
  modifyField(situation_id, 'description', description, callback);
}

function modifySituationLocation(situation_id, location, callback){
  var callback = callback || function(){};
  modifyField(situation_id, 'location', location, callback);
}

function modifySituationPeriod(situation_id, period, callback){
  var callback = callback || function(){};
  modifyField(situation_id, 'period', period, callback);
}

function modifySituationSlug(situation_id, slug, callback){
  var callback = callback || function(){};

  fetch.situation(slug, function(fetch_error, situation){
    if (fetch_error || situation.moved){
      return modifyField(situation_id, 'slug', slug, callback);
    }

    callback(errors.slugInUse(slug), null);
  });
}

function modifyRelationDescription(relation_id, description, callback){
  var callback = callback || function(){};
  modifyField(relation_id, 'description', description, callback);
}




module.exports = {
  situation: {
    title: modifySituationTitle,
    slug: modifySituationSlug,
    description: modifySituationDescription,
    location: modifySituationLocation,
    period: modifySituationPeriod,
    tags: modifySituationTags,
    mark: markDocument,
    unmark: unmarkDocument
  },
  relation: {
    description: modifyRelationDescription,
    strength: modifyRelationStrength,
    mark: markDocument,
    unmark: unmarkDocument
  }
}
