var express = require("express");
var router = express.Router();
var multer = require("multer");
var upload = multer({ dest: "uploadedFiles/" });
var Usage = require("../models/Usage");
var User = require("../models/User");
var File = require("../models/File");
var util = require("../util");

// get station information
router.get("/:stationName", async function (req, res) {
  complexityService.getComplexity(req.params.stationName);
  finedustService.getFinedust(req.params.stationName);
  var page = Math.max(1, parseInt(req.query.page));
  var limit = Math.max(1, parseInt(req.query.limit));
  page = !isNaN(page) ? page : 1;
  limit = !isNaN(limit) ? limit : 10;

  var skip = (page - 1) * limit;
  var maxPage = 0;
  var searchQuery = await createSearchQuery(req.query);
  var usage = [];

  if (searchQuery) {
    var count = await Usage.countDocuments(searchQuery);
    maxPage = Math.ceil(count / limit);
    usage = await Usage.aggregate([
      { $match: searchQuery },
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "author",
        },
      },
      { $unwind: "$author" },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },

      {
        $lookup: {
          from: "files",
          localField: "attachment",
          foreignField: "_id",
          as: "attachment",
        },
      },
      {
        $unwind: {
          path: "$attachment",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          title: 1,
          author: {
            username: 1,
          },
          views: 1,
          numId: 1,
          attachment: {
            $cond: [
              { $and: ["$attachment", { $not: "$attachment.isDeleted" }] },
              true,
              false,
            ],
          },
          createdAt: 1,
        },
      },
    ]).exec();
  }

  res.render("usage/index", {
    usage: usage,
    currentPage: page,
    maxPage: maxPage,
    limit: limit,
    searchType: req.query.searchType,
    searchText: req.query.searchText,
  });
});

module.exports = router;

// private functions
function checkPermission(req, res, next) {
  Usage.findOne({ numId: req.params.id }, function (err, usage) {
    if (err) return res.json(err);
    if (usage.author != req.user.id) return util.noPermission(req, res);

    next();
  });
}

async function createSearchQuery(queries) {
  var searchQuery = {};
  if (
    queries.searchType &&
    queries.searchText &&
    queries.searchText.length >= 3
  ) {
    var searchTypes = queries.searchType.toLowerCase().split(",");
    var postQueries = [];
    if (searchTypes.indexOf("title") >= 0) {
      postQueries.push({
        title: { $regex: new RegExp(queries.searchText, "i") },
      });
    }
    if (searchTypes.indexOf("body") >= 0) {
      postQueries.push({
        body: { $regex: new RegExp(queries.searchText, "i") },
      });
    }
    if (searchTypes.indexOf("author!") >= 0) {
      var user = await User.findOne({ username: queries.searchText }).exec();
      if (user) postQueries.push({ author: user._id });
    } else if (searchTypes.indexOf("author") >= 0) {
      var users = await User.find({
        username: { $regex: new RegExp(queries.searchText, "i") },
      }).exec();
      var userIds = [];
      for (var user of users) {
        userIds.push(user._id);
      }
      if (userIds.length > 0) postQueries.push({ author: { $in: userIds } });
    }
    if (postQueries.length > 0) searchQuery = { $or: postQueries };
    else searchQuery = null;
  }
  return searchQuery;
}
