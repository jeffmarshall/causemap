nano = require "nano"
async = require 'async'
utils = require './utils'
ops = require './ops'




# ## Creates and saves a change object
#
# Usage:
#
#   createChange object_id, field_name, changed_from, changed_to [, callback]
#
# Example:
#   
#   createChange {_id: '1234567890', type: 'situation'}, 'title', 'Global Wanking', 'Global Warming', console.log
#   >> { ok: true
#   >>   id: '0987654321' }

createChange = (changed_document, field_name, changed_from, changed_to, callback= ->) ->
  change = 
    type: 'change'
    changed: 
      _id: changed_document._id
      type: changed_document.type
    field: field_name
    forward: changed_to
    backward: changed_from

  ops.save change, callback



# ## Creates and saves a situation object
#
# Usage:
#
#   createSituation title [, callback]
#
# Example:
#
#   createSituation 'Student Protests', console.log
#   >> { ok: true,
#   >>   id: '1234567890'
#   >>   change: '0987654321' }

createSituation = (title, callback= ->) ->
  
  situation = 
    title: title
    type: 'situation'

  ops.save situation, (error_saving_situation, saved_situation) ->
    if error_saving_situation
      return callback error_saving_situation, null

    createChange saved_situation, 'creation_date', undefined, saved_situation.creation_date, (error_saving_change, saved_change) ->
      if error_saving_change
        return callback error_saving_change, null

      callback null, 
        ok: true
        id: saved_situation._id
        change: saved_change._id



# ## Creates and saves a relation object
#
# Usage:
#
#   createRelation cause_id, effect_id [, callback]
#
# Example:
#
#   createRelation '1234567890', '8907654332', console.log
#   >> { ok: true,
#   >>   id: '139864876',
#   >>   change: '1239876498' }

createRelation = (cause_id, effect_id, callback= ->) ->

  # Check that both the cause and effect exist

  async.parallel [
    # Check that cause exists
    (parallel_callback) ->
      utils.exists cause_id, (err, exists) ->
        if err
          error = 
            error: 'not_found'
            message: "Cause not found: #{cause_id}"
          return parallel_callback error, null
        
        return parallel_callback null, 'cause exists'

    # Check that effect exists
    (parallel_callback) ->
      utils.exists effect_id, (err, exists) ->
        if err
          error = 
            error: 'not_found'
            message: "Effect not found: #{effect_id}"
          return parallel_callback error, null
        
        return parallel_callback null, 'effect exists'

  ], (async_error, results) ->
    if async_error
      return callback err, null

    # There were no errors
    relation = 
      cause: 
        _id: cause_id
      effect: 
        _id: effect_id
      type: 'relation'

    # Save the new relation
    ops.save relation, (error_saving_relation, saved_relation) ->
      if error_saving_relation
        return callback error_saving_relation, null

      createChange saved_relation, 'creation_date', undefined, saved_relation.creation_date, (error_saving_change, saved_change) ->
        if error_saving_change
          return callback error_saving_change, null

        return callback null, 
          ok: true
          id: saved_relation._id
          change: saved_change._id




module.exports = 
  situation: createSituation
  relation: createRelation
  change: createChange
