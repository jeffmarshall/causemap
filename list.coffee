_ = require 'underscore'
async = require 'async'
ops = require './ops'



attachChangedToChangeRow = (row, callback) ->
  change = row.value
  ops.fetch change.changed._id, (fetch_error, changed) ->
    if fetch_error
      return callback fetch_error, null

    change.changed = changed
    return callback null, row


attachSituationsToRelationRow = (row, opts..., callback) ->
  options = opts[0]
  relation = row.value

  fetchCause = (parallel_callback) ->
    ops.fetch relation.cause._id, (fetch_error, cause) ->
      if fetch_error
        error_fetching_cause = 
          error: 'error_fetching_cause'
          message: "Could not fetch cause for relation '#{relation._id}'"
          actual_error: fetch_error
          
        return parallel_callback error_fetching_cause, null
      relation.cause = cause
      return parallel_callback null, cause

  fetchEffect = (parallel_callback) ->
    ops.fetch relation.effect._id, (fetch_error, effect) ->
      if fetch_error
        error_fetching_effect = 
          error: 'error_fetching_effect'
          message: "Could not fetch effect for relation '#{relation._id}'"
          actual_error: fetch_error
          
        return parallel_callback error_fetching_effect, null
      relation.effect = effect
      return parallel_callback null, effect

  parallel_functions = []

  unless options and options.not_needed is 'cause' or options and 'cause' in options.not_needed
    parallel_functions.push fetchCause
  
  unless options and options.not_needed is 'effect' or options and 'effect' in options.not_needed
    parallel_functions.push fetchEffect

  async.parallel parallel_functions, (parallel_error, results) ->
    if parallel_error
      return callback parallel_error, null

    return callback null, relation


mapChangedToChangeRows = (rows, callback) ->
  async.map rows, attachChangedToChangeRow, (map_error, map_result) ->
    if map_error
      return callback map_error, null

    return callback null, map_result


mapSituationsToRelationRows = (rows, opts..., callback) ->
  options = opts[0]

  createSituationAttachmentFunction = ->
    return (row, callback) ->
      attachSituationsToRelationRow row, options, callback

  async.map rows, createSituationAttachmentFunction(), (map_error, map_result) ->
    if map_error
      return callback map_error, null

    return callback null, map_result



earliestSituations = (opts..., callback= ->) ->
  view_options = opts[0] or {}
  ops.view 'situations', 'by_creation_date', view_options, callback


earliestChanges = (opts..., callback= ->) ->
  view_options = opts[0] or {}

  ops.view 'changes', 'by_creation_date', view_options, (view_error, view_result) ->
    if view_error
      return callback view_error, null

    if view_options.get_changed is true
      mapChangedToChangeRows view_result.rows, (map_error, map_result) ->
        if map_error
          return callback map_error, null

        view_result.rows = map_result
        return callback null, view_result
    else
      return callback null, view_result


earliestRelations = (opts..., callback= ->) ->
  view_options = opts[0] or {}
  ops.view 'relations', 'by_creation_date', view_options, (view_error, view_result) ->
    if view_error
      return callback view_error, null

    if view_options.include_situations is true
      mapSituationsToRelationRows view_result.rows, (map_error, map_result) ->
        if map_error
          return callback map_error, null

        view_result.rows = map_result
        return callback null, view_result
    else
      return callback null, view_result
      


latestSituations = (opts..., callback= ->) ->
  options = opts[0] or {}
  default_view_options = 
    descending: true

  view_options = _.extend default_view_options, options

  earliestSituations view_options, callback


latestChanges = (opts..., callback= ->) ->
  options = opts[0] or {}
  default_view_options = 
    descending: true

  view_options = _.extend default_view_options, options

  earliestChanges view_options, callback


latestRelations = (opts..., callback= ->) ->
  options = opts[0] or {}
  default_view_options = 
    descending: true

  view_options = _.extend default_view_options, options

  earliestRelations view_options, callback


situtionsByMark = (mark_name, opts..., callback= ->) ->
  options = opts[0]
  default_view_options = 
    startkey: [mark_name + '\u9999']
    endkey: [mark_name]
    descending: true

  view_options = _.extend default_view_options, options

  ops.view 'situations', 'marked', view_options, callback


changesToDocument = (doc_id, opts..., callback= ->) ->
  options = opts[0]
  default_view_options = 
    startkey: [doc_id + '\u9999']
    endkey: [doc_id]
    descending: true

  view_options = _.extend default_view_options, options

  ops.view 'changes', 'by_changed', view_options, callback


effectsOfSituation = (situation_id, opts..., callback= ->) ->
  options = opts[0]
  default_view_options = 
    startkey: [situation_id, 'cause' + '\u9999']
    endkey: [situation_id, 'cause']
    descending: true

  view_options = _.extend default_view_options, options

  ops.view 'relations', 'by_cause_and_effect', view_options, (view_error, view_result) ->
    if view_error
      return callback view_error, null

    mapSituationsToRelationRows view_result.rows, { not_needed: 'cause' }, (map_error, map_result) ->
      if map_error
        return callback map_error, null

      view_result.rows = map_result
      return callback null, view_result



causesOfSituation = (situation_id, opts..., callback= ->) ->
  options = opts[0]
  default_view_options = 
    startkey: [situation_id, 'effect' + '\u9999']
    endkey: [situation_id, 'effect']
    descending: true

  view_options = _.extend default_view_options, options

  ops.view 'relations', 'by_cause_and_effect', view_options, (view_error, view_result) ->
    if view_error
      return callback view_error, null

    mapSituationsToRelationRows view_result.rows, { not_needed: 'effect' }, (map_error, map_result) ->
      if map_error
        return callback map_error, null

      view_result.rows = map_result
      return callback null, view_result


situationsMarked = (mark_name, opts..., callback= ->) ->
  options = opts[0]
  default_view_options = 
    startkey: [mark_name + '\u9999']
    endkey: [mark_name]
    descending: true

  view_options = _.extend default_view_options, options

  ops.view 'situations', 'marked', view_options, callback


relationsMarked = (mark_name, opts..., callback= ->) ->
  options = opts[0]
  default_view_options = 
    startkey: [mark_name + '\u9999']
    endkey: [mark_name]
    descending: true

  view_options = _.extend default_view_options, options

  ops.view 'relations', 'marked', view_options, callback



module.exports = 
  earliest:
    situations: earliestSituations
    changes: earliestChanges
    relations: earliestRelations
  latest:
    situations: latestSituations
    changes: latestChanges
    relations: latestRelations
  situations:
    marked: situationsMarked
  relations:
    marked: relationsMarked
  changes: changesToDocument
  effects: effectsOfSituation
  causes: causesOfSituation
