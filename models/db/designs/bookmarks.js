var toJSON = JSON.stringify;


module.exports = {
  _id: '_design/cm_bookmarks',
  language: 'javascript',
  validate_doc_update: function(new_doc, old_doc, user_context){

    function required(be_true, message){
      if (!be_true) throw { forbidden: message };
    }
  
    function unchanged(field) {
      if (old_doc && toJSON(old_doc[field]) != toJSON(new_doc[field]))
        throw({ forbidden : "Field can't be changed: " + field });
    }

    if (new_doc.type === 'bookmark'){
      
      required(
        new_doc.hasOwnProperty('user'), 
        '`user` is required.'
      );

      required(
        new_doc.hasOwnProperty('bookmarked'), 
        '`bookmarked` is required'
      );

      var bookmarked = new_doc.bookmarked;

      required(
        bookmarked.hasOwnProperty('_id'), 
        '`bookmarked._id` is required.'
      );

      required(
        typeof bookmarked._id === 'string',
        '`bookmarked._id` must be a string.'
      );

      required(
        bookmarked.hasOwnProperty('type'), 
        '`bookmarked.type` is required.'
      );

      required(
        ['situation', 'relationship'].indexOf(bookmarked.type) != -1,
        '`bookmarked.type` must be either `situation` or `relationship`.'
      );
    }
  },

  views: {
    by_bookmarked: {
      map: function(doc){
        emit([doc.changed._id, doc.changed.type, doc.creation_date], null);
      },

      reduce: function(keys, values, rereduce){
        if (rereduce) return sum(values);
        return values.length;
      }
    }
  }
}

