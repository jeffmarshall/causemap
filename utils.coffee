async = require 'async'
ops = require './ops'
config = require './config'
initNano = ops.initNano




getHeaders = (id, callback= ->) ->
  nano = initNano()

  options = 
    db: config.get 'dbname'
    doc: id
    method: 'HEAD'

  nano.request options, (err, result, headers) ->
    callback err, headers



exists = (id, callback= ->) ->
  getHeaders id, (err, headers) ->
    callback err, headers['status-code'] is 200




module.exports = 
  headers: getHeaders
  exists: exists
