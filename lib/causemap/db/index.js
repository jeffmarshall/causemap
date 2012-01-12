var create = require('./create');
var destroy = require('./destroy');



function reset(client, callback){
  // First we destroy.
  destroy.everything(client, function(err, res){
    if (err || !res.ok){
      callback(err || {error: "DBs Not destroyed."});
      return;
    }

    create.everything(client, callback);
  });
}



module.exports = {
  create: create,
  destroy: destroy,
  reset: reset
}
