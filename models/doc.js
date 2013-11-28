var util = require('util');
var config = require('../config');
var EventEmitter = require('events').EventEmitter;
var db = require('./db').db;
var nano = require('./db').nano;



function getHeaders(id, callback){
  var request_options = {
    db: config.get('couchdb').database,
    doc: id,
    method: 'HEAD'
  }

  nano().request(request_options, function(request_error, result, headers){
    return callback(request_error, headers);
  });
};


var Doc = function Doc(id){
  if (!(this instanceof Doc)) return new Doc(id);
  if (id) { this.id = id }
  this.tmp = {};
}


util.inherits(Doc, EventEmitter);


Doc.prototype.validate = function validateDoc(callback){
  return callback(null, true);
};


Doc.prototype.create = function createDoc(doc_body, callback){
  var self = this;

  switch(arguments.length){
    case 0: var callback = function(){}; var doc_body = {}; break;
    case 1: var callback = arguments[0]; var doc_body = {}; break;
    case 2: var callback = arguments[1]; var doc_body = arguments[0]; break;
  }

  doc_body.type = self.type;
  doc_body._id = typeof self.id === 'string' ? self.id : undefined;

  self.tmp.doc_body = doc_body;
  self.validate(function(validation_error, validation_result){
    if (validation_error){ return callback(validation_error, null) }

    return db().insert(doc_body, function(insert_error, result){
      if (insert_error){
        return callback(insert_error, null);
      }
  
      self.id = result.id;

      delete self.tmp.doc_body;

      self.emit('create', result);
      return callback(null, result);
    });
  });
}


Doc.prototype.read = function readDoc(callback){
  var self = this;
  db().get(self.id, function(get_error, doc){
    if (get_error) { return callback(get_error, null) }
    self.emit('read', doc);
    return callback(null, doc);
  });
}


Doc.prototype.exists = function(callback){
  if (!this.id){ return callback(null, false) }
  getHeaders(this.id, function(header_error, headers){
    return callback(
      header_error, headers ? headers['status-code'] === 200 : null
    );
  });
}


Doc.prototype.update = function updateDoc(operation, callback){
  var self = this;
  self.read(function(read_error, doc_body){
    if (read_error){
      return callback(read_error, null);
    }

    var updated_doc_body = operation(doc_body);

    if (!updated_doc_body._id){
      var error = { 
        error: 'invalid', 
        message: 'Operation must not remove the _id.'
      }

      return callback(error, null);
    }

    if (updated_doc_body._rev != doc_body._rev){
      var error = {
        error: 'invalid',
        message: "Operation must not alter the document's _rev."
      }

      return callback(error, null);
    }

    updated_doc_body._id = self.id;
    updated_doc_body.type = self.type;

    self.tmp.doc_body = updated_doc_body;
    self.tmp.old_doc_body = doc_body;

    self.validate(function(validation_error, validation_result){
      if (validation_error){ return callback(validation_error, null) }

      db().insert(
        updated_doc_body, 
        self.id, 
        function(insert_error, insert_result){
          if (insert_error){
            if (insert_error.error == "conflict"){
              return self.update(operation, callback);
            }
  
            return callback(insert_error, null);
          }
  
          self.emit('update', insert_result);
          return callback(null, insert_result);
      });
    });

    delete self.tmp.doc_body;
    delete self.tmp.old_doc_body;
  });
};


Doc.prototype.updateField = function updateDocField(
  fieldName, 
  value, 
  callback
){
  var self = this;

  self.update(function(doc_body){
    doc_body[fieldName] = value;
    return doc_body
  }, callback);
}


Doc.prototype.delete = function deleteDoc(callback){
  var self = this;

  self.read(function(read_error, doc_body){
    if (read_error){
      return callback(read_error, null);
    }

    db().destroy(
      doc_body._id, 
      doc_body._rev, 
      function(destroy_error, destroy_result){
        if (destroy_error){ return callback(destroy_error, null) }

        destroy_result.doc_body = doc_body;

        self.emit('delete', destroy_result);
        return callback(null, destroy_result);
      });
  });
}



module.exports = Doc

