var elastical = require('elastical');
var config = require('../config');



module.exports = function searchClient(){
  var es_settings = config.get('elasticsearch');
  return new elastical.Client(es_settings.host, es_settings.options);
}
