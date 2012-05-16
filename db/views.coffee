module.exports.identify = 
  _id: '_design/identify'
  language: 'javascript'
  views:
    situation:
      map: (doc) ->
        if doc.type is 'situation' 
          emit [doc._id, 1, 'situation'], doc
          if doc.slug
            emit [doc.slug, 1, 'situation'], doc
        if doc.type is 'change'
          if doc.field is 'slug' and doc.backward
            emit [doc.backward, 2, 'change'], doc


module.exports.earliest = 
  _id: '_design/earliest'
  language: 'javascript'
  views:
    everything:
      map: (doc) ->
        if doc.creation_date
          emit(new Date(doc.creation_date).getTime(), doc)
    situations:
      map: (doc) ->
        if doc.type is 'situation'
          emit(new Date(doc.creation_date).getTime(), doc)
    relations:
      map: (doc) ->
        if doc.type is 'relation'
          emit(new Date(doc.creation_date).getTime(), doc)
    changes:
      map: (doc) ->
        if doc.type is 'change'
          emit(new Date(doc.creation_date).getTime(), doc)
    marked:
      map: (doc) ->
        if doc.marked
          creation_date = new Date doc.creation_date
          for mark_name of doc.marked
            emit [mark_name, creation_date.getTime(), doc.type], doc



module.exports.relations = 
  _id: '_design/relations'
  language: 'javascript'
  views:
    by_cause_and_effect:
      map: (doc) ->
        if doc.type is 'relation'
          creation_date = new Date doc.creation_date
          emit [doc.cause._id, 'cause', creation_date.getTime()], doc
          emit [doc.effect._id, 'effect', creation_date.getTime()], doc
    marked_for_deletion:
      map: (doc) ->
        if doc.type is 'relation' and doc.marked_for_deletion
          creation_date = new Date doc.creation_date
          emit creation_date.getTime(), doc

          

module.exports.changes = 
  _id: '_design/changes'
  language: 'javascript'
  views:
    by_changed: 
      map: (doc) ->
        if doc.type is 'change'
          creation_date = new Date doc.creation_date
          emit [doc.changed._id, creation_date.getTime()], doc


module.exports.suggest = 
  _id: '_design/suggest'
  views:
    situations:
      map: (doc) ->
        if doc.type is 'situation' and doc.title
          for i in [0..doc.title.length-1]
            emit doc.title.slice(i).toLowerCase(), doc
