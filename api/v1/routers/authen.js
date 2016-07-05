var express = require('express');
var router = express.Router();
var crypto = require('./../helper/crypto');
var jwt = require('jsonwebtoken');
var userData = require('./../models/users');


router.get('/signup',function(req, res){
  res.send("hi");
});

//Signup route  #Signup
router.post('/signup',function(req, res, next){
  var name = req.body.name;
  var email = req.body.email;
  var password = req.body.password;

  if(name == null && name == ""){
    send({errorcode:'01', message:"name is null"});
  }else if(email == null){
    send({errorcode:'02', message:"email is null"});
  }else if(password == null){
    send({errorcode:'03', message:"password is null"});
  }else{
    var salt = crypto.createSalt();
    var hashPwd = crypto.hashPwd(salt, password);
    // create new user here
    userData.create({
      'name': name,
      'email': email,
      'salt': salt,
      'hash': hashPwd
    },function(err, data){
      if(err){
        res.send(err);
      }else{
        res.json(data);

      }

    });
  }

});

//Login route #Login
router.post('/login', function(req, res, next){
  var email = req.body.email;
  var password = req.body.password;
  if(email != null){
    userData.findOne({email:email},function(err, collection){
      if(err){
        res.send(err);
      }else{
        var checkauthen = crypto.checkPWD(collection, password);
        if(checkauthen){
          var token = jwt.sign(checkauthen, 'pbl-collectme');
          res.json({'success':true, id:collection._id, name:collection.name, email:collection.email, token: token, date: Date.now()});
        }else{
          res.send({errorcode:'202', message:"Fail to authentication, password or username are incorrect"});
        }

      }
    });
  }else{
    res.send({errorcode:'02', message:"email is null"});
  }
});
module.exports = router;
