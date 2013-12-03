var toJSON = JSON.stringify;


module.exports = {
  _id: '_design/cm-changes',
  language: 'javascript',
    views: {
    by_changed: {
      map: function(doc){
        if (doc.type == 'change'){
          emit([
            doc.changed.doc._id, 
            doc.changed.doc.type, 
            doc.creation_date
          ], null);
        }
      },

      reduce: function(keys, values, rereduce){
        if (rereduce) return sum(values);
        return values.length;
      }
    }
  }
}

