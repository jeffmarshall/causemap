var async = require('async');

var Doc = require('./doc');
var design = require('./db/designs/bookmarks');



/* Bookmark model.
 *
 * {
 *   user: { _id: '123' },
 *   bookmarked: {
 *     _id: '1234',
 *     type: 'situation'
 *   }
 * }
 *
 */

var Bookmark = function Bookmark(id){
  if (!(this instanceof Bookmark)) return new Bookmark(id);
  if (id) { this.id = id; }
  this.type = 'bookmark';
}



Bookmark.prototype = new Doc();



Bookmark.prototype.validate = function validateBookmark(callback){
  var self = this;

  try {
    design.validate_doc_update(self.tmp.doc_body, self.tmp.old_doc_body);
  } catch (validation_error){
    return callback(validation_error, null);
  }

  // make sure that both the User and the object being bookmarked are valid

  var user = new Doc(self.tmp.doc_body.user._id)
  var bookmarked = new Doc(self.tmp.doc_body.bookmarked._id);

  async.parallel([
    function(parallel_callback){
      user.exists(function(existence_error, exists){
        if (existence_error) return parallel_callback(existence_error, null);
        if (!exists){
          return parallel_callback({
            error: 'does_not_exist', 
            message: "User does not exist"
          }, null)
        }

        return parallel_callback(null, { user_exists: exists });
      });     
    },
    function(parallel_callback){
      bookmarked.exists(function(existence_error, exists){
        if (existence_error) return parallel_callback(existence_error, null);
        if (!exists){
          return parallel_callback({
            error: 'does_not_exist', 
            message: "Bookmarked object does not exist"
          }, null)
        }

        return parallel_callback(null, { bookmarked_exists: exists });
      });     
    },
  ], function(parallel_error, parallel_result){
    if (parallel_error) return callback(parallel_error, null);

    // Looks like the things exist, continue with validation.
    return Doc.prototype.validate.call(self, callback);
  })
}





Bookmark.prototype.create = function createBookmark(doc_body, callback){
  var self = this;

  doc_body.creation_date = (new Date()).getTime();
  Doc.prototype.create.call(self, doc_body, callback);
};





module.exports = Bookmark;
