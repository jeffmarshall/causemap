


var toJSON = JSON.stringify;


module.exports = {
  _id: '_design/adjustments',
  language: 'javascript',
  validate_doc_update: function(new_doc, old_doc, user_context){

    function required(be_true, message){
      if (!be_true) throw { forbidden: message };
    }
  
    function unchanged(field) {
      if (old_doc && toJSON(old_doc[field]) != toJSON(new_doc[field]))
        throw({ forbidden : "Field can't be changed: " + field });
    }

    if (new_doc.type == 'adjustment'){
      required(
        new_doc.hasOwnProperty('adjusted'),
        "An adjustment must have an 'adjusted' field."
      );

      required(
        new_doc.hasOwnProperty('user'),
        "An adjustment must have a 'user' field."
      );

      required(
        new_doc.user.hasOwnProperty('_id'),
        "An adjustment.user must have an '_id' field."
      );

      required(
        new_doc.hasOwnProperty('creation_date'),
        "Must have a 'creation_date' field."
      );

      unchanged(new_doc.adjusted);
      var adjusted = new_doc.adjusted;

      required(
        adjusted.hasOwnProperty('doc'),
        "'adjusted' must have a 'doc' field."
      );

      required(
        adjusted.doc.hasOwnProperty('_id'),
        "'adjusted.doc' must have a '_id' field."
      );

      required(
        adjusted.doc.hasOwnProperty('type'),
        "'adjusted.doc' must have a 'type' field."
      );

      required(
        adjusted.hasOwnProperty('field'),
        "'adjusted' must have a 'field' field."
      );

      required(
        adjusted.field.hasOwnProperty('name'),
        "'adjusted.field' must have a 'name' field."
      );

      required(
        typeof adjusted.field.name == 'string',
        "'adjusted.field.name' must be a string."
      );

      required(
        adjusted.field.hasOwnProperty('by'),
        "'adjusted.field' must have a 'by' field."
      );

      required(
        typeof adjusted.field.by == 'number',
        "'adjusted.field.name' must be a number."
      );
    }
  },

  views: {
    by_adjusted_field: {
      map: function(doc){
        if (doc.type == 'adjustment'){
          emit([
            doc.adjusted.doc._id,
            doc.adjusted.field.name,
            doc.creation_date
          ], doc.adjusted.field.by);
        }
      },
      reduce: function(keys, values, rereduce){
        if (rereduce){ return sum(values) }
        return sum(values);
      }
    },

    by_user: {
      map: function(doc){
        if (doc.type == 'adjustment'){
          emit([
            doc.user._id
          ], null)
        }
      }
    }
  }
}
