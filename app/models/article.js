'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const notify = require('../mailer');

const Schema = mongoose.Schema;

const getTags = tags => tags.join(',');
const setTags = tags => tags.split(',');

/**
 * Article Schema
 */

const Articleschema = new Schema({
  title: { type : String, default : '', trim : true },
  body: { type : String, default : '', trim : true },
  user: { type : Schema.ObjectId, ref : 'User' },
  comments: [{
    body: { type : String, default : '' },
    user: { type : Schema.ObjectId, ref : 'User' },
    createdAt: { type : Date, default : Date.now }
  }],
  tags: { type: [], get: getTags, set: setTags },
  image: {
    cdnUri: String,
    files: []
  },
  createdAt  : { type : Date, default : Date.now }
});

/**
 * Validations
 */

Articleschema.path('title').required(true, 'Article title cannot be blank');
Articleschema.path('body').required(true, 'Article body cannot be blank');

/**
 * Pre-remove hook
 */

Articleschema.pre('remove', function (next) {

  // remove [file] from s3
/*  var params = {
    Bucket: 'STRING_VALUE'
  };
  s3.deleteBucket(params, function(err, data) {
    if (err) console.log(err, err.stack);
    else     console.log(data);
  });*/

  next();
});

/**
 * Methods
 */

Articleschema.methods = {

  /**
   * Save Article and upload image
   *
   * @param {Object} images
   * @api private
   */

  uploadAndSave: function (file) {
    const err = this.validateSync();
    if (err && err.toString()) throw new Error(err.toString());

    if (!file) return this.save();

    // stream [file] directly to s3

/*    AWS.config.region = 'us-west-2';

    var s3bucket = new AWS.S3({params: {Bucket: 'myBucket'}});

    s3bucket.createBucket(function() {
      var params = {Key: 'myKey', Body: 'Hello!'};
      s3bucket.upload(params, function(err, data) {
        if (err) {
          console.log("Error uploading data: ", err);
        } else {
          console.log("Successfully uploaded data to myBucket/myKey");
        }
      });
    });*/

  },

  /**
   * Add comment
   *
   * @param {User} user
   * @param {Object} comment
   * @api private
   */

  addComment: function (user, comment) {
    this.comments.push({
      body: comment.body,
      user: user._id
    });

    if (!this.user.email) this.user.email = 'email@product.com';

    notify.comment({
      article: this,
      currentUser: user,
      comment: comment.body
    });

    return this.save();
  },

  /**
   * Remove comment
   *
   * @param {commentId} String
   * @api private
   */

  removeComment: function (commentId) {
    const index = this.comments
      .map(comment => comment.id)
      .indexOf(commentId);

    if (~index) this.comments.splice(index, 1);
    else throw new Error('Comment not found');
    return this.save();
  }
};

/**
 * Statics
 */

Articleschema.statics = {

  /**
   * Find Article by id
   *
   * @param {ObjectId} id
   * @api private
   */

  load: function (_id) {
    return this.findOne({ _id })
      .populate('user', 'name email username')
      .populate('comments.user')
      .exec();
  },

  /**
   * List articles
   *
   * @param {Object} options
   * @api private
   */

  list: function (options) {
    const criteria = options.criteria || {};
    const page = options.page || 0;
    const limit = options.limit || 30;
    return this.find(criteria)
      .populate('user', 'user name email username')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(limit * page)
      .exec();
  }
};

mongoose.model('Article', Articleschema);
