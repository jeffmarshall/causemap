var client = require('./client');



module.exports = function settings(index_name){
  return {
    get:  function getSetting(key, callback){
      client().get(index_name, key, function(get_error, setting_doc){
        if (get_error){ return callback(get_error, null) }
        return callback(null, setting_doc.value);
      });
    },

    set: function setSetting(key, value, callback){
      client().set(
        index_name, 
        'setting', 
        { value: value }, 
        { id: key }, 
        function(
          set_error, 
          set_result
        ){
          if (set_error){ return callback(set_error, null) }
          return callback(null, set_result);
        }
      );
    },

    unset: function unsetSetting(key, callback){
      client().delete(index_name, 'setting', key, callback);
    }
  }
}
