module.exports = {
  notFound: function(doc_id){
    return {
      error: 'not_found',
      message: "Document '"+ doc_id +"' not found."
    }
  },
  alreadyTagged: function(tag){
    return {
      error: 'already_tagged',
      message: "Situation already tagged '"+ tag +"'."
    }
  },
  notTagged: function(tag){
    return {
      error: 'not_tagged',
      message: "Situation not tagged '"+ tag +"'."
    }
  },
  notMarked: function(mark_name){
    return {
      error: 'not_marked',
      message: "Document not marked '"+ mark_name +"'."
    }
  },
  slugInUse: function(slug){
    return {
      error: 'slug_in_use',
      message: "Slug '"+ slug +"' is in use."
    }
  },
  designNotFound: function(design_name){
    return {
      error: 'design_not_found',
      message: "Design '"+ design_name +"' not found."
    }
  },
  operationDidNotReturnDoc: function(){
    return {
      error: 'operation_error',
      message: 'Operation did not return a document.'
    }
  }
}
