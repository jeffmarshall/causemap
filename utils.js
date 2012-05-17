var ops = require('./ops');




function getHeaders(id, callback){
  var nano = ops.initNano();

  request_options = {
    db: config.get('dbname'),
    doc: id,
    method: 'HEAD'
  }

  nano.request(request_options, function(request_error, result, headers){
    callback(request_error, headers);
  });
}


function exists(id, callback){
  getHeaders(id, function(headers_error, headers){
    callback(headers_error, headers ? headers['status-code'] === 200 : null);
  });
}



module.exports = {
  headers: getHeaders,
  exists: exists
}
