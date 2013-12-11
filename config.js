var _ = require('lodash');
var cartography = require('cartography');
var auth = require('auth');



module.exports = (function(){
  try {
    var configs = require('./settings');
  } catch (e){
    var configs = {};
  }

  return {
    set: function(){
      switch(arguments.length){
        case 1: _.extend(configs, arguments[0]); break;
        case 2: configs[arguments[0]] = arguments[1]; break;
      }

      cartography.config.set('couchdb', configs.couchdb);
      auth.config.set('couchdb', configs.couchdb);
      return;
    },
    get: function(key){
      if (key === undefined){
        return _.clone(configs);
      }

      return configs[key];
    }
  }
})();
