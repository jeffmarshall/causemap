var _ = require('lodash');
var cartography = require('cartography');
var auth = require('auth');



module.exports = _.extend(
  cartography.models,
  auth.models
);

module.exports.Bookmark = require('./bookmark');
module.exports.User = require('./user');
module.exports.Relationship = require('./relationship');
