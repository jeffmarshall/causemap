_ = require 'underscore'


# The purpose of this module is to provide a single accesspoint for causemap
# configurations.
#
# Usage:
#
#   config = require './config'
#   
#   config.set 'dbhost', 'http://example.com:5984'
#   >> 'http://example.com:5984'
#
#   config.get 'dbhost'
#   >> 'http://example.com:5984'
#
#   # set configs in bulk
#   config.set {dbhost: 'http://example.com:5984', dbname: 'causemap'}
#   >> {dbhost: 'http://example.com:5984', dbname: 'causemap'}
module.exports = do ->
  configs = {}

  return {
    set: (key, value) ->
      if _.isObject key
        return _.extend configs, key
      return configs[key] = value
    get: (key) ->
      return configs[key]
  }
