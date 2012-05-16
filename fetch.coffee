nano = require "nano"
async = require 'async'
ops = require './ops'
views = require './db/views'




# ## Fetch a situation
#
# GET a situation by either it's `_id` or it's `slug`
#
# Usage:
#
#   fetchSituation situation_id [, callback]
#
# Example: 
#   
#   fetchSituation '8bb64c66c8e46092abb94cccf402b109', console.log
#   >>  null { _id: '8bb64c66c8e46092abb94cccf402b109',
#   >>    _rev: '1-2a5c84459d50ee19fec05db24a0b3bd8',
#   >>    title: 'This is a Situation',
#   >>    type: 'situation',
#   >>    creation_date: '2012-05-02T22:17:53.643Z' }
#   
#   # it also identifies situations by slugs
#
#   fetchSituation 'global-warming', console.log
#   >> null { _id: '8bb64c66c8e46092abb94cccf402b165',
#   >>   _rev: '1-2a5c84459d50ee19fec05db24a0awd389a8',
#   >>   slug: 'global-warming'
#   >>   title: 'Global Warming',
#   >>   type: 'situation',
#   >>   creation_date: '2012-05-02T22:17:53.643Z' }
#   
#   # it even identifies situations by old slugs (until a new situation claims
#   # the old slug)
#
#   fetchSituation 'global-warming-effect', console.log
#   >> null { _id: '8bb64c66c8e46092abb94cccf402b165',
#   >>   _rev: '1-2a5c84459d50ee19fec05db24a0awd389a8',
#   >>   moved: { _id: 'a9s8d79a8sd78a7s9d86as8d79a87sd9asd90a',
#   >>      _rev: '1-as97d6a87s5g76dgds78as79d687a6s8d768',
#   >>      changed: '8bb64c66c8e46092abb94cccf402b165',
#   >>      field: 'slug',
#   >>      forward: 'global-warming',
#   >>      backward: 'global-warming-effect',
#   >>      type: 'change' }
#   >>   slug: 'global-warming'
#   >>   title: 'Global Warming',
#   >>   type: 'situation',
#   >>   creation_date: '2012-05-02T22:17:53.643Z' }

fetchSituation = (situation_id, callback= ->) ->

  not_found = 
    error: 'not_found'
    message: "A situation could not be identified by '#{situation_id}'."

  view_options = 
    startkey: [situation_id]
    endkey: [situation_id, '\u9999']

  retry = ->
    fetchSituation situation_id, callback

  ops.view 'identify', 'situation', view_options, (view_error, docs) ->
    if view_error
      return callback view_error, null

    for row in docs.rows
      doc = row.value

      if doc.type is 'situation'
        return callback null, doc

      if doc.type = 'change'
        change = doc
        ops.fetch change.changed._id, (fetch_error, changed) ->
          if fetch_error
            return callback fetch_error, null

          if changed.type is 'situation'
            situation = changed
            situation.moved = change
            return callback null, situation
          else
            return callback not_found, null
        return

    return callback not_found, null




# ## Fetch a change boject
#
# Retrieve a change document and optionally retrieve the document the change is
# related to. This function accepts the following `options`:
#
# - `fetch_changed`: Boolean
#
# Usage:
#
#   fetchChange change_id [, options, callback]
#
# Examples:
#
#   fetchChange '12345', console.log # results printed on-screen
#
#   fetchChange '12345', (err, change) ->
#     if err
#       return console.log 'error:', err
#     console.log 'change:', change
#
#   # don't bother retrieving the object that the change relates to
#   fetchChange '12345', {fetch_changed: false}, (err, change) ->
#     if err
#       return callback 'error:', err
#     console.log 'change:', change

fetchChange = (args...) ->
  change_id = args[0]

  switch args.length
    when 2 
      callback = args[1]
    when 3 
      options = args[1]
      callback = args[2]
    else
      callback = ->

  change = null

  ops.fetch change_id, (err, change_doc) ->
    if err
      return callback err, null

    change = change_doc
    
    if options and options.fetch_changed
      ops.fetch change.changed._id, (err, changed) ->
        if err
          return callback err, null

        change.changed = changed

        return callback null, change

    else
      return callback null, change

  return true




# ## Fetch a relation object
#
# Retrieves a relation document with the given id and the situations in the
# relationship unless otherwise specified.
#
# Usage: 
#
#   fetchRelation relation_id [options, callback]
#
# Examples: 
#
#   # Get the relation along with it's cause and effect situations and print
#   # the results on-screen
#
#   fetchRelation '12345', (err, relation) ->
#     console.log relation.cause.title  # => 'Global Warming'
#     console.log relation.effect.title # => 'Melting Polar Icecaps'
#
#   # Do not retrieve the cause
#   fetchRelation '12345', {not_needed: 'cause'}, (err, relation) ->
#     console.log relation.cause  # => '67890'
#     console.log relation.effect # => {title: '...', description: ... }
#
#   # Do not retrieve either the cause or the effect, just return the relation
#   # document
#   fetchRelation '12345', {not_needed: ['cause', 'effect']}, (err, relation) ->
#     console.log relation.cause  # => '67890'
#     console.log relation.effect # => '09876'

fetchRelation = (args...) ->
  relation_id = args[0]

  switch args.length
    when 2
      callback = args[1]
    when 3
      options = args[1]
      callback = args[2]

  relation = null

  ops.fetch relation_id, (err, relation_doc) ->
    if err
      return callback err, null

    relation = relation_doc

    async.parallel [
      (parallel_callback) ->
        unless options and ('cause' in options.not_needed or options.not_needed is 'cause')
          fetchSituation relation.cause._id, (err, situation) ->
            if err
              return parallel_callback err, null

            relation.cause = situation
            return parallel_callback null, situation
        else
          parallel_callback null, null
      (parallel_callback) ->
        unless options and ('effect' in options.not_needed or options.not_needed is 'effect')
          fetchSituation relation.effect._id, (err, situation) ->
            if err
              return parallel_callback err, null

            relation.effect = situation
            return parallel_callback null, situation
        else
          parallel_callback null, null
    ], (err, results) ->
      if err
        return callback err, null

      return callback null, relation



module.exports = 
  situation: fetchSituation
  change: fetchChange
  relation: fetchRelation
