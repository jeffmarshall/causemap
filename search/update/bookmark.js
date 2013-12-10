var _ = require('lodash');

var updateOperationsForSituation = require('./situation');



module.exports = function updateOperationsForBookmark(
  doc,
  callback
){
  var bookmark = doc;
  var update_ops = [];
  var bookmarked = bookmark.bookmarked;

  if(bookmarked.type == 'situation'){
    updateOperationsForSituation(
      bookmarked,
      function(ops_error, operations){
        if (ops_error){ return callback(ops_error, null) }
        update_ops.push(operations);
        return callback(null, _.flatten(update_ops));
      }
    );
  }
}
