var cartography = require('cartography');
var Bookmark = require('./bookmark');





var User = function User(id){
  if (!(this instanceof User)) return new User(id);
  if (id) { this.id = id; }
  this.type = 'user';
}



User.prototype = new cartography.models.User();



User.prototype.bookmark = function createBookmarkForUser(bookmarked, callback){
  var self = this;
  var bookmarked_id = bookmarked.id || bookmarked._id;

  var new_bookmark = new Bookmark([
    self.id,
    'bookmarked',
    bookmarked_id
  ].join(':'));

  return new_bookmark.create({
    user: { _id: self.id },
    bookmarked: {
      _id: bookmarked_id,
      type: bookmarked.type
    }
  }, callback)
}



User.prototype.unbookmark = function deleteBookmarkForUser(
  bookmarked, 
  callback
){
  var self = this;
  var bookmarked_id = bookmarked.id || bookmarked._id;

  var bookmark = new Bookmark([
    self.id,
    'bookmarked',
    bookmarked_id
  ].join(':'));

  return bookmark.delete(callback)
}





module.exports = User;
