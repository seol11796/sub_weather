var express = require('express');
var router = express.Router();
var User = require('../models/User');
var util = require('../util');

// New
router.get('/new', function(req, res){
  var user = req.flash('user')[0] || {};
  var errors = req.flash('errors')[0] || {};
  res.render('users/new', { user:user, errors:errors });
});

// create
router.post('/', function(req, res){
  User.create(req.body, function(err, user){
    if(err){
      req.flash('user', req.body);
      req.flash('errors', util.parseError(err));
      return res.redirect('/users/new');
    }
    res.redirect('/');
  });
});



// show
router.get('/:username', util.isLoggedin, checkPermission, function(req, res){
  User.findOne({username:req.params.username}, function(err, user){
    console.log(user);
    if(err) return res.json(err);

    // req.query.subway_name을 User DB에 저장하는 서비스
  user.favorites.push(req.query.subway_name);
   user.save();


    res.render('users/show', {user:user, subway_name1:user.favorites[0], subway_name2:user.favorites[1], subway_name3:user.favorites[2]});
  });


});


// delete favorite
router.get('/delete/:username', util.isLoggedin, checkPermission, function(req, res){
  User.findOne({username:req.params.username}, function(err, user){
    console.log(user);
    if(err) return res.json(err);

    // req.query.subway_name을 User DB에 저장하는 서비스
  user.favorites.remove(req.query.subway_name);
   user.save();


    res.render('users/show', {user:user, subway_name1:user.favorites[0], subway_name2:user.favorites[1], subway_name3:user.favorites[2]});
  });


}
  );

// edit
router.get('/:username/favorite', util.isLoggedin, checkPermission, function(req, res){
  var user = req.flash('user')[0];
  var errors = req.flash('errors')[0] || {};
  if(!user){
    User.findOne({username:req.params.username}, function(err, user){
      
      console.log(user);
      console.log(user.username);
      console.log(user.favorites);

      if(err) return res.json(err);
      res.render('users/favorite', {user:user, subway_name1:user.favorites[0], subway_name2:user.favorites[1], subway_name3:user.favorites[2]});
    });
  }
  else {
    
  }
});





// favorite update
router.get('/:username/edit', util.isLoggedin, checkPermission, function(req, res){
    var user = req.flash('user')[0];
    var errors = req.flash('errors')[0] || {};
    if(!user){
      User.findOne({username:req.params.username}, function(err, user){
        if(err) return res.json(err);
        res.render('users/edit', { username:req.params.username, user:user, errors:errors });
      });
    }
    else {
      res.render('users/edit', { username:req.params.username, user:user, errors:errors });
    }
  });


// update
router.put('/:username', util.isLoggedin, checkPermission, function(req, res, next){
  User.findOne({username:req.params.username})
    .select('password')
    .exec(function(err, user){
      if(err) return res.json(err);

      // update user object
      user.originalPassword = user.password;
      user.password = req.body.newPassword? req.body.newPassword : user.password;
      for(var p in req.body){
        user[p] = req.body[p];
      }

      // save updated user
      user.save(function(err, user){
        if(err){
          req.flash('user', req.body);
          req.flash('errors', util.parseError(err));
          return res.redirect('/users/'+req.params.username+'/edit');
        }
        res.redirect('/users/'+user.username);
      });
  });
});

module.exports = router;

// private functions
function checkPermission(req, res, next){
  User.findOne({username:req.params.username}, function(err, user){
    if(err) return res.json(err);
    if(user.id != req.user.id) return util.noPermission(req, res);

    next();
  });
}