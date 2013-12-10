#!/usr/local/bin/node

var _ = require('lodash');
var repl = require("repl");
var context = repl.start("$ ").context;

cm = require('./');

context = _.extend(context, cm.models);
context.cm = cm;
