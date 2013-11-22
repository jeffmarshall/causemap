var _ = require('lodash');



module.exports = (function(){
  try {
    var configs = require('./settings');
  } catch (e){
    var configs = {};
  }

  return {
    set: function(){
      switch(arguments.length){
        case 1: _.extend(configs, arguments[0]); return arguments[0];
        case 2: configs[arguments[0]] = arguments[1]; return arguments[1];
      }
    },
    get: function(key){
      if (key === undefined){
        return _.clone(configs);
      }

      return configs[key];
    }
  }
})();
