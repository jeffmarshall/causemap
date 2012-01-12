

// This view is for auto-suggest. It will emit all substrings of each
// situation's text in lowercase. Include the query as a key lookup on this
// view to get only the documents with the substring in their titles.

var suggestSubstring = {
  map: function(doc) {
    var i;
    if (doc.title) {
      for (i = 0; i < doc.title.length; i += 1) {
          emit(doc.title.slice(i).toLowerCase(), doc);
      }
    }
  }
}


// all situations ordered by creation date
var sortByCreationDate = {
  map: function(doc){
    if (doc.creation_date){
      var creation_date = new Date(doc.creation_date);
      emit(creation_date.getTime(), doc);
    }
  }
}


var sortByCause = {
  map: function(doc){
    emit(doc.cause, doc);
  }
}


var sortByEffect = {
  map: function(doc){
    emit(doc.effect, doc);
  }
}


var situation = {db_name: 'situations'};
situation.designs = {
  'suggest': {
    views: {
      'substring': suggestSubstring
    }
  },
  'sort_by': {
    views: {
      'creation_date': sortByCreationDate
    }
  }
}


var relation = {db_name: 'relations'}
relation.designs = {
  'sort_by': {
    views: {
      'cause': sortByCause,
      'effect': sortByEffect
    }
  }
}

module.exports = {
  situation: situation,
  relation: relation
}
