var _ = require('lodash');
var cartography = require('cartography');
var auth = require('auth');



module.exports = (function(){
  try {
    var configs = require('./settings');
  } catch (e){
    var configs = {};
  }

  function configureDependencies(){
    cartography.config.set('couchdb', configs.couchdb);
    cartography.config.set('couchdb_testing', configs.couchdb_testing);
    auth.config.set(configs.auth);
    auth.config.set('couchdb', configs.couchdb);
    auth.config.set('couchdb_testing', configs.couchdb_testing);
  }
  
  configureDependencies();

  return {
    set: function(){
      switch(arguments.length){
        case 1: _.extend(configs, arguments[0]); break;
        case 2: configs[arguments[0]] = arguments[1]; break;
      }

      configureDependencies();
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
