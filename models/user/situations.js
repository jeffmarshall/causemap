var async = require('async');

var db = require('../db').db;

var Situation = require('../situation');
var Action = require('../action');
var User = require('./');




User.prototype.createSituation = function(title, callback){
  var user = this;
  var situation_creation_result;

  function slugify(value){
    return value
      .toLowerCase()
      .replace(/-+/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  var new_situation = new Situation();
  new_situation.create(function(creation_error, creation_result){
    if (creation_error) return callback(creation_error, null);
    situation_creation_result = creation_result;

    async.parallel([
      function(parallel_callback){
        // change the situation's title
        new_situation.title(title, function(title_error, title_result){
          if (title_error) return parallel_callback(title_error, null);

          var change_action = new Action([
            'created',
            title_result.id
          ].join(':'));

          change_action.create({
            user: { _id: user.id },
            verb: 'created',
            subject: {
              _id: title_result.id,
              type: 'change'
            }
          }, parallel_callback)
        });
      },

      function(parallel_callback){
        // change the situation's alias
        var slugified_title = slugify(title);

        new_situation.alias(
          slugified_title, 
          function(alias_error, alias_result){
            if (alias_error){
              return parallel_callback(null, { aliased: false });
            }

            var change_action = new Action([
              'created',
              alias_result.id
            ].join(':'));

            change_action.create({
              user: { _id: user.id },
              verb: 'created',
              subject: {
                _id: alias_result.id,
                type: 'change'
              }
            }, parallel_callback)
          }
        );
      },

      function(parallel_callback){
        // record the user's action
        var situation_creation_action = new Action([
          'created',
          creation_result.id
        ].join(':'));

        situation_creation_action.create({
          user: { _id: user.id },
          verb: 'created',
          subject: {
            _id: creation_result.id,
            type: 'situation'
          }
        }, parallel_callback);
      }
    ], function(parallel_error, parallel_result){
      if (parallel_error){
        callback(parallel_error, null);
        new_situation.delete(function(){});
      }

      return callback(null, creation_result);
    })
  })
}
