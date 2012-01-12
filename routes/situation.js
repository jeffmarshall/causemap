var situation = require('../lib/causemap/situation');



function viewSituation(req, res){
  var situation_id = req.params.situation_id;

  situation.get(situation_id, function(err, situation){
    if (err){
      res.json(err);
      return;
    }

    res.render('situation', {title: situation.title, situation: situation});
    console.log('situ route', situation);
  });
}


exports.view = viewSituation;
