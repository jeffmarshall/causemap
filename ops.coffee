async = require 'async'
config = require './config'
designs = require './db/designs'
nano = require 'nano'
pkg = require './package'

api_version = pkg.version


initializeNano = ->
  return nano config.get 'dbhost'

initializeDb = ->
  return initializeNano().use config.get 'dbname' 


# TODO this is a really lazy way of stapling attributes to an object just
# before it's saved. There really should be a model for each kind of thing
# where this stuff happend.
saveDoc = (doc, callback= ->)->

  db = initializeDb()

  unless doc._id
    doc.creation_date = new Date()
    doc.api_version = api_version

  db.insert doc, (err, result) ->
    if err
      return callback err, null

    doc._id = result.id
    doc._rev = result.rev
    
    return callback null, doc
  return true


fetchDoc = (document_id, callback= ->) ->
  db = initializeDb()
  db.get document_id, callback
  return true


viewOrInsertDesign = (args...) ->
  design_name = args[0]
  view_name = args[1]
  options = {}

  switch args.length
    when 2
      callback = ->
    when 3
      callback = args[2]
    when 4
      options = args[2]
      callback = args[3]

  db = initializeDb()
  db.view design_name, view_name, options, (view_error, docs) ->
    if view_error
      if view_error.error is 'not_found'
        db.insert designs[design_name], designs[design_name]._id, (view_insert_error, view_insert_result) ->
          if view_insert_error
            if view_insert_error is 'conflict'
              return callback view_error, null
            return callback view_insert_error, null
          return viewOrInsertDesign design_name, view_name, options, callback
        return
      return callback view_error, null
    return callback null, docs
  return true


atomicOperation = (id, operation, callback= ->) ->
  thing = null
  db = initializeDb()

  async.series [

    # Get the thing and perform the operation on it
    (series_callback) ->
      db.get id, (err, doc) ->
        if err
          return series_callback err, null

        try
          thing = operation doc
        catch error
          return series_callback error, null

        return series_callback null, thing

    # Save the new thing
    (series_callback) ->
      saveDoc thing, series_callback

  ], (err, results) ->
    if err
      if err.error is 'conflict'
        return atomicOperation id, operation, callback
      return callback err, null
    return callback null, results[1]
  return true


deleteDoc = (document_id, callback= ->) ->
  retrieved_document = null
  db = initializeDb()

  async.series [
    (series_callback) ->
      fetchDoc document_id, (error_fetching, document) ->
        if error_fetching
          return series_callback error_fetching, null

        retrieved_document = document

        return series_callback null, document
    (series_callback) ->
      db.destroy retrieved_document._id, retrieved_document._rev, series_callback
  ], (series_error, results) ->
    if series_error
      if series_error.error is 'conflict'
        return deleteDoc document_id, callback
      return callback series_error, null

    return callback null, 
      ok: true
      deleted: retrieved_document




module.exports = 
  atomic: atomicOperation
  save: saveDoc
  fetch: fetchDoc
  view: viewOrInsertDesign
  delete: deleteDoc
  initNano: initializeNano
  initDb: initializeDb
