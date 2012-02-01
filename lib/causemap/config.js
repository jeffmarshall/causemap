module.exports = (function(){
  var configs = {};

  return {
    set: function(key, value){
      configs[key] = value;
      return true;
    },
    get: function(key){
      return configs[key];
    }
  }
})();
