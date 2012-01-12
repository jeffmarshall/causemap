var EventEmitter = require('events').EventEmitter;
var couchdb = require('felix-couchdb');
var save_situation = require('../lib/causemap').save_situation;

// TODO change the port to be some non-default
var client = couchdb.createClient(5984, 'localhost');
var situation_db = client.db('situations');
var relation_db = client.db('relations');

exports.index = function(req, res){

  situation_db.view(
    'sort_by', 
    'creation_date', 
    {descending: true}, 
    function(err, docs){
      var latest_situations = docs.rows.map(function(row){return row.value});

      res.render('index', {
        title: 'Situations by Cause and Effect', 
        latest_situations: latest_situations
      });
    }
  );
};

exports.situation = require('./situation').view;

exports.new_situation = function(req, res){
  res.render('new_situation', {title: 'New Situation'});
}

exports.post_new_situation = function(req, res){

  // post it to couchdb
  var new_situation = req.body.situation;


  var cause_values = req.body.as_values_causes_list;

  if (cause_values){
    new_situation.causes = cause_values
      .substring(0, cause_values.length-1)
      .split(',');
  } else {
    new_situation.causes = [];
  }


  var effect_values = req.body.as_values_effects_list;

  if (effect_values){
    new_situation.effects = effect_values
      .substring(0, effect_values.length-1)
      .split(',');
  } else {
    new_situation.effects = [];
  }
  
  console.log('s:', new_situation);

  // save_situation(new_situation, function(situation){
  //   console.log('situation saved:', situation.id);
  //   res.redirect('/s/'+ situation.id);
  // });
  
  var post_situation = require('../lib/causemap/situation/post');
  
  post_situation(new_situation, function(err, situation){
    console.log('saved situation:', situation);
    res.redirect('/s/'+ situation.id);
  });

}

exports.suggest = function(req, res){
  var q = req.query.q.toLowerCase();


  situation_db.view('suggest', 'substring', {
    startkey: q,
    endkey: q+"\u9999"
  }, function(err, docs){
    
    var items = [];

    for(row_number in docs.rows){
      var row = docs.rows[row_number];
      items.push(
        {id: row.id, title: row.value.title, value: row.value.title}
      );
    }

    // res.send(JSON.stringify(data));
    res.json(items);
  });
}
