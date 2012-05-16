_ = require 'underscore'
ops = require './ops'
create = require './create'
fetch = require './fetch'




modifyStringField = (document_id, field_name, new_value, callback= ->) ->
  old_value = null

  changeField = (retrieved_document) ->
    old_value = retrieved_document[field_name]
    retrieved_document[field_name] = new_value
    return retrieved_document

  ops.atomic document_id, changeField, (atomic_error, modified_document) ->
    if atomic_error
      return callback atomic_error, null

    create.change modified_document, field_name, old_value, new_value, (error_saving_change, change) ->
      if error_saving_change
        return callback error_saving_change, null

      return callback null, 
        ok: true
        id: document_id
        change: change._id


addToArrayField = (document_id, field_name, new_value, callback= ->) ->
  old_array_field = null

  addValue = (retrieved_document) ->
    array_field = old_array_field = _.clone retrieved_document[field_name]

    if not _.isArray array_field
      retrieved_document[field_name] = [new_value]
      return retrieved_document

    unless array_field.indexOf new_value is -1
      throw new Error "Object '#{retrieved_document._id}' already has '#{new_value}' in '#{field_name}'"

    retrieved_document[field_name].push new_value

    return retrieved_document

  ops.atomic document_id, addValue, (atomic_error, modified_document) ->
    if atomic_error
      return callback atomic_error, null

    create.change modified_document, field_name, old_array_field, modified_document[field_name], (error_saving_change, change) ->
      if error_saving_change
        return callback error_saving_change, null

      return callback null, 
        ok: true
        id: document_id
        change: change._id


removeFromArrayField = (document_id, field_name, value, callback= ->) ->
  old_array_field = null

  removeValue = (retrieved_document) ->
    array_field = retrieved_document[field_name]
    old_array_field = _.clone array_field

    if not _.isArray array_field or not array_field.indexOf value >= 0
      throw new Error "Object '#{retrieved_document._id}' doesn't have '#{value}' in '#{field_name}'"

    value_position_in_array = array_field.indexOf value
    array_field.splice value_position_in_array, 1

    if not array_field.length
      delete retrieved_document[field_name]

    return retrieved_document

  ops.atomic document_id, removeValue, (atomic_error, modified_document) ->
    if atomic_error
      return callback atomic_error, null

    create.change modified_document, field_name, old_array_field, modified_document[field_name], (error_saving_change, change) ->
      if error_saving_change
        return callback error_saving_change, null

      return callback null, 
        ok: true
        id: document_id
        change: change._id


changeDocumentMark = (document_id, mark_name, change_type, callback= ->) ->
  old_marks = null
  operation = null

  mark = (retrieved_document) ->
    old_marks = _.clone retrieved_document.marked

    already_marked_error = 
      error: 'already_marked'
      message: "Document '#{retrieved_document._id}' already marked '#{mark_name}'."

    if _.isObject retrieved_document.marked 
      if retrieved_document.marked[mark_name]
        throw already_marked_error
    else
      retrieved_document.marked = {}

    retrieved_document.marked[mark_name] = new Date()
    return retrieved_document

  unmark = (retrieved_document) ->
    old_marks = _.clone retrieved_document.marked

    not_marked_error = 
      error: 'not_mark'
      message: "Document '#{document_id}' is not marked '#{mark_name}'"

    if _.isObject retrieved_document.marked
      if retrieved_document.marked[mark_name]
        delete retrieved_document.marked[mark_name]

        if _.isEmpty retrieved_document.marked
          delete retrieved_document.marked
      else
        throw not_marked_error
    else 
      throw not_marked_error

    return retrieved_document

  switch change_type
    when 'mark' then operation = mark
    when  'unmark' then operation = unmark

  ops.atomic document_id, operation, (atomic_error, modified_document) ->
    if atomic_error
      return callback atomic_error, null

    create.change modified_document, 'marked', old_marks, modified_document.marked, (error_saving_change, change) ->
      if error_saving_change
        return callback error_saving_change, null

      return callback null, 
        ok: true
        id: document_id
        change: change._id


markDocument = (document_id, mark_name, callback= ->) ->
  changeDocumentMark document_id, mark_name, 'mark', callback


unmarkDocument = (document_id, mark_name, callback= ->) ->
  changeDocumentMark document_id, mark_name, 'unmark', callback


modifySituationTitle = (situation_id, new_title, callback= ->) ->
  modifyStringField situation_id, 'title', new_title, callback


modifySituationSlug = (situation_id, new_slug, callback= ->) ->
  fetch.situation new_slug, (fetch_error, situation) ->
    if fetch_error or situation.moved
      return modifyStringField situation_id, 'slug', new_slug, callback
    
    slug_taken_error = 
      error: 'slug_taken'
      message: "The slug is already being used."

    return callback slug_taken_error, null


modifySituationDescription = (situation_id, new_description, callback= ->) ->
  modifyStringField situation_id, 'description', new_description, callback


modifySituationLocation = (situation_id, new_location, callback= ->) ->
  modifyStringField situation_id, 'location', new_location, callback


modifySituationPeriod = (situation_id, new_period, callback= ->) ->
  modifyStringField sitaution_id, 'period', new_period, callback


modifySituationTags = (situation_id, operation_type, tag, callback= ->) ->
  switch operation_type
    when 'add'
      addToArrayField situation_id, 'tags', tag, callback
    when 'remove'
      removeFromArrayField situation_id, 'tags', tag, callback


modifyRelationDescription = (relation_id, new_description, callback= ->) ->
  modifyStringField relation_id, 'description', new_description, callback




module.exports = 
  situation:
    title: modifySituationTitle
    slug: modifySituationSlug
    description: modifySituationDescription
    location: modifySituationLocation
    period: modifySituationPeriod
    tags: modifySituationTags
    mark: markDocument
    unmark: unmarkDocument
  relation:
    description: modifyRelationDescription
    mark: markDocument
    unmark: unmarkDocument
