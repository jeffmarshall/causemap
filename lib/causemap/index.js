var config = require('./config');



module.exports = {
  config: config,
  client: function(couchdb_host){
    if (couchdb_host){
      config.set('couchdb_host', couchdb_host);
    }

    var client = {
      relation: require('./relation'),
      situation: require('./situation')
    }

    return client
  }
}
