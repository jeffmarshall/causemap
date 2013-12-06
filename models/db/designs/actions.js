


var toJSON = JSON.stringify;


module.exports = {
  _id: '_design/actions',
  language: 'javascript',
  validate_doc_update: function(new_doc, old_doc, user_context){

    // TODO: validation of the 'verb' field should check for a list of allowed
    // phrases: 'created', 'updated', etc.

    function required(be_true, message){
      if (!be_true) throw { forbidden: message };
    }
  
    function unchanged(field) {
      if (old_doc && toJSON(old_doc[field]) != toJSON(new_doc[field]))
        throw({ forbidden : "Field can't be changed: " + field });
    }

    if (new_doc.type == 'action'){
      required(
        new_doc.hasOwnProperty('verb'),
        "An action must have a 'verb' field."
      );

      required(
        new_doc.hasOwnProperty('user'),
        "An action must have a 'user' field."
      );

      required(
        new_doc.user.hasOwnProperty('_id'),
        "'user' must have an '_id' field."
      );

      required(
        new_doc.hasOwnProperty('creation_date'),
        "An action must have a 'creation_date' field."
      );

      required(
        new_doc.hasOwnProperty('subject'),
        "An action must have a 'subject' field."
      );

      required(
        new_doc.subject.hasOwnProperty('_id'),
        "'subject' must have an '_id' field."
      );

      required(
        new_doc.subject.hasOwnProperty('type'),
        "'subject' must have a 'type' field."
      );

      required(
        typeof new_doc.verb == 'string',
        "'verb' must be a string."
      );
    }
  },

  views: {
    by_user_verb_and_doc: {
      map: function(doc){
        if (doc.type == 'action'){
          emit([
            doc.user._id,
            doc.verb,
            doc.subject._id,
            doc.creation_date
          ], null);
        }
      },
      reduce: function(keys, values, rereduce){
        if (rereduce){ return sum(values) }
        return keys.length;
      }
    }
  }
}
