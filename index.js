var cartography = require('cartography');
var config = require('./config');


cartography.config.set('couchdb', config.get('couchdb'));



module.exports = {
  models: require('./models'),
  search: require('./search'),
  config: config
}
