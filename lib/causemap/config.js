

var config = (function(){
  var configs = {};

  return {
    get: function(key){
      return configs[key]
    },
    set: function(key, value){
      configs[key] = value;
      return true
    }
  }
})();


module.exports = config;
