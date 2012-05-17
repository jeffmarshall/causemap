module.exports.situations = {
  _id: '_design/situations',
  language: 'javascript',
  views: {
    by_creation_date: {
      map: function(doc){
        if (doc.type === 'situation'){
          var creation_date = new Date(doc.creation_date);
          emit(creation_date.getTime(), doc);
        }
      }
    },
    marked: {
      map: function(doc){
        if(doc.type === 'situation' && doc.marked){
          for (mark_name in doc.marked){
            var mark_date = new Date(doc.marked[mark_name]);
            emit([mark_name, mark_date.getTime()], doc);
          }
        }
      }
    }
  }
}



module.exports.relations = {
  _id: '_design/relations',
  language: 'javascript',
  views: {
    by_creation_date: {
      map: function(doc){
        if(doc.type === 'relation'){
          var creation_date = new Date(doc.creation_date);
          emit(creation_date.getTime(), doc);
        }
      }
    },
    by_cause_and_effect: {
      map: function(doc){
        if(doc.type === 'relation'){
          var creation_date = new Date(doc.creation_date);

          emit([
            doc.cause._id, 
            'cause', 
            doc.strength, 
            creation_date.getTime()
          ], doc);

          emit([
            doc.effect._id, 
            'effect', 
            doc.strength, 
            creation_date.getTime()
          ], doc);
        }
      }
    },
    marked: {
      map: function(doc){
        if (doc.type === 'relation' && doc.marked){
          for (mark_name in doc.marked){
            var mark_date = new Date(doc.marked[mark_name]);
            emit([mark_name, mark_date.getTime()], doc);
          }
        }
      }
    }
  }
}



module.exports.changes = {
  _id: '_design/changes',
  language: 'javascript',
  views: {
    by_creation_date: {
      map: function(doc){
        if (doc.type === 'change'){
          var creation_date = new Date(doc.creation_date);
          emit(creation_date.getTime(), doc);
        }
      }
    },
    by_changed: {
      map: function(doc){
        if (doc.type === 'change'){
          var creation_date = new Date(doc.creation_date);
          emit([doc.changed._id, creation_date.getTime()], doc);
        }
      }
    }
  }
}



module.exports.identify = {
  _id: '_design/identify',
  language: 'javascript',
  views: {
    situation: {
      map: function(doc){
        if (doc.type === 'situation'){
          emit([doc._id, 1, 'situation'], doc);
          if (doc.slug){
            emit([doc.slug, 1, 'situation'], doc);
          }
        }
        if (doc.type === 'change' && doc.field === 'slug' && doc.backward){
          emit([doc.backward, 2, 'change'], doc);
        }
      }
    }
  }
}



module.exports.suggest = {
  _id: '_design/suggest',
  language: 'javascript',
  views: {
    situations: {
      map: function(doc){
        if (doc.type === 'situation' && doc.title){
          for (var i = 0; i < doc.title.length; i++){
            emit(doc.title.slice(i).toLowerCase(), doc);
          }
        }
      }
    }
  }
}
