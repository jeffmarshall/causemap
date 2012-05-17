var _ = require('underscore');



module.exports = (function(){
  var configs = {};

  return {
    set: function(){
      switch(arguments.length){
        case 1: _.extend(configs, arguments[0]); return arguments[0];
        case 2: configs[arguments[0]] = arguments[1]; return arguments[1];
      }
    },
    get: function(key){
      return configs[key];
    }
  }
})();
