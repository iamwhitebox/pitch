'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const { wrap: async } = require('co');
const { respond } = require('../utils');
const User = mongoose.model('User');
const Article = mongoose.model('Article');

/**
 * Show dashboard
 */

exports.index = async(function* (req, res) {
  const user = req.profile || req.user;
  const articles = yield Article.list({
    criteria: {user: user._id }
  });

  respond(res, 'dashboard/index', {
    title: user.name,
    user: user,
    articles: articles
  });
});