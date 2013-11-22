var config = require('../../config');
var es = require('../client')



module.exports = function deleteDeletedDoc(doc, callback){
  es().search({
    filter: {
      term: { _id: doc._id }
    }
  }, function(search_error, search_result){
    if (search_error){ return callback(search_error, null) }

    var deletion_ops = search_result.hits.map(function(hit){
      return {
        delete: {
          index: hit._index,
          type: hit._type,
          id: hit._id
        }
      }
    });

    return callback(null, deletion_ops);
  });
}
