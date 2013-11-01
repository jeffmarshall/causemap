var _ = require('lodash');
var async = require('async');
var designs = require('./designs');
var Doc = require('../doc');



var update_operations = [];


function updateOrCreatable(design){
  return function(callback){
    var design_doc = new Doc(design._id);

    design_doc.update(function(old_design){
      design._rev = old_design._rev;
      return design;
    }, function(update_err){
      if (update_err){
        if (update_err.error == 'not_found'){
          design._rev = undefined;

          return design_doc.create(design, function(creation_err){
            if (creation_err){
              return callback(creation_err, null);
            }

            return callback(null, { created: design_doc.id })
          });
        }

        return callback(update_err, null);
      }

      return callback(null, { updated: design_doc.id });
    }); // end update
  }
}


for (key in designs){
  var design = designs[key];

  update_operations.push(updateOrCreatable(design));
}


async.parallel(update_operations, console.log);
