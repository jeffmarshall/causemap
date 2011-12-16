/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Situations by Cause and Effect' })
};

exports.situation = function(req, res){
  res.render('situation', {title: 'Situation'});
}
