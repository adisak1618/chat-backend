var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var middleware = require('./../helper/middleware');
var userData = require('./../models/users');
var messageData = require('./../models/message');
var textSearch = require("mongoose-text-search");
//test authentication
router.get('/test', middleware.isLogin, function(req, res, next){
  res.send(req.userdata);
});

//add new topic
router.post('/topic', middleware.isLogin, function(req, res, next){
  topic = {};
  topic.topic = req.body.topic;
  topic.status = 0;
  topic.description = req.body.description ? req.body.description : 'ไม่มีรายละเอียด';
  topic.own_id = { id: req.userdata._id, name: req.userdata.name};
  topic.messages = [];
  topic.join_list = [];
  console.log(topic);
  messageData.create(topic, function(err, data){
    if(err){
      res.send(err);
    }else{
      res.send(data);
    }
  });

});

// Delete document
router.post('/del/:id', middleware.isLogin, function (req, res, next) {
  messageData.findOne({_id: req.params.id}).remove(function (err, data) {
    if (err) {
      res.send(err);
    } else {
      res.send({'code': 0, 'message': 'Remove success!!!'})
    }
  });
});
//Join the topic. after that you can chat with that topic
router.post('/join/:id', middleware.isLogin, function(req, res, next){
  messageData.update({'_id': req.params.id,'join_list.user_id': {$ne: req.userdata._id}},
    {
      $addToSet: {"join_list": {user_id: req.userdata._id}}
    },
    function(err, data){
      if(err){
        res.send(err);
      }else{
        if(data.nModified <= 0){
          res.json({join_success: false, message:'you can not join this topic because you already join this topic'});
        }else{
          res.json({join_success: true, message:'Join success'});
        }
      }
    }
  );
});

//recive the message from the user and the we can send to other people who join this topic by using socket.io
router.post('/text/:id', middleware.isLogin, function(req, res, next){

  text = {};
  text.messageType = req.body.type;
  text.message = req.body.text;
  text.user_id = req.userdata._id;
  text.name = req.userdata.name;
  console.log(text);
  // messageData.update({'_id': req.params.id, 'join_list.user_id': req.userdata._id,  },
  // {
  //   $addToSet: {"messages": text}
  // },
  // function(err, data){
  //   if(err){
  //     res.send(err);
  //   }else{
  //     if(data.nModified <= 0){
  //       // res.send({message_success: false, message:'you can sent message. maybe it because you not join this topic yet!'});
  //       res.send(data);
  //     }else{
  //       res.send({message_success: true, message:'Send message success!'});
  //     }
  //   }
  // });

  messageData.findById(req.params.id, function (err, collection) {
    if (err) {
      res.send(err);
    } else {
      collection.messages.push(text);
      collection.save(function (err, data) {
        if (err) {
          res.send('Can not save message');
        } else {
          res.send('Success');
        }
      });

    }
  });

  // messageData.update({'_id': req.params.id},
  //   {
  //     $addToSet: {"messages": text}
  //   },
  //   function(err, data){
  //     if(err){
  //       res.send(err);
  //     }else{
  //       if(data.nModified <= 0){
  //         res.json('Fail');
  //       }else{
  //         res.json('Success');
  //       }
  //     }
  //   }
  // );

});

//when i have nothing to talk or topic is too long, i want to stop talking, so i can close this topic.
router.post('/close/:id', middleware.isLogin, function(req, res, next){
  // messageData.update({'_id': req.params.id, 'own_id': req.userdata._id,  },
  // {
  //   $set: {"status": 1}
  // },
  // function(err, data){
  //   if(err){
  //     res.send(err);
  //   }else{
  //     if(data.nModified <= 0){
  //       // res.send({message_success: false, message:'you can sent message. maybe it because you not join this topic yet!'});
  //       res.send(data);
  //     }else{
  //       res.send({message_success: true, message:'Close this topic already!'});
  //     }
  //   }
  // });
  messageData.findById(req.params.id, function (err, data) {
    if (err) {
      res.send(err);
    } else {
      data.status = 1;
      data.save((err, data) => {
        if (err) {
          res.send(err);
        } else {
          res.json(data);
        }
      });
    }
  })
});

//I want to talk about e-sport, i want to find the topic that i want to talk, so i can find the topic about e-sport
// Feed
router.get('/find/:option', function(req, res, next){
  messageData.find({topic: new RegExp(req.params.option, 'i')}, null, {sort: {createDate: -1}}, function(err, data){
    if(err){
      res.send(err);
    }else {
      res.send(data);
    }

  });
});

//I want to talk about something, i want to find the topic that i want to talk, so i can view the list of topic
// Feed
router.get('/topics/:option/:ofset', function(req, res, next){
  var option = (req.params.option ? req.params.option : 'ALL');
  var ofset = (req.params.ofset ? Number(req.params.ofset) : 0);
  switch (option) {
    case 'ALL':
        messageData.find({}).skip(ofset).limit(20).sort({createDate: -1}).exec(function(err, data){
          console.log('ALL');
          if(err){
            res.send(err);
          }else{
            res.send(data);
          }
        });
        break;
      case 'OPEN':
        console.log('OPEN');
        messageData.find({status:0}).skip(ofset).limit(20).sort({createDate: -1}).exec(function(err, data){
          if(err){
            res.send(err);
          }else{
            res.send(data);
          }
        });
        break;
      case 'CLOSE':
        console.log('CLOSE');
        messageData.find({status:1}).skip(ofset).limit(20).sort({createDate: -1}).exec(function(err, data){
          if(err){
            res.send(err);
          }else{
            res.send(data);
          }
        });
        break;
      case 'CLOSE_POPULAR':
        Pop_topic(res, 1);
        break;
      case 'OPEN_POPULAR':
        Pop_topic(res, 0);
        break;
      default:
        console.log('default');
        if ( req.params.ofset === 'CLOSE') {
          messageData.find({status:1, 'own_id.id': req.params.option}).exec(function(err, data){
            if(err){
              res.send(err);
            }else{
              res.send(data);
            }
          });
        } else {
          messageData.find({status:0, 'own_id.id': req.params.option}).exec(function(err, data){
            if(err){
              res.send(err);
            }else{
              res.send(data);
            }
          });
        }

  }
});

//I want to know about this topic, i want to read all the message in this topic, so i read every message in the website.
//Respone list of message in this topic id
router.get('/topic/:id',function(req, res, next){
  messageData.findOne({_id: req.params.id}, function(err, data){
    if(err){
      res.send(err);
    }else{
      res.send(data);
    }
  });

});

router.get('/topics',function(req, res, next){
  messageData.find({}, null, {sort: {createDate: -1}})
  .exec(function(err, data){
    if(err){
      res.send(err);
    }else{
      res.send(data);
    }
  });

});


function Pop_topic (res, type) {
  messageData.aggregate([
    {
      "$project": {
        "topic": "$topic",
        "status": "$status",
        "description": "$description",
        "createDate": "$createDate",
        "join_list": "$join_list",
        "messages": "$messages",
        "length": {"$size": "$join_list"},
        "own_id": "$own_id"
      }
    },
    { "$sort": { "length": -1 } },
    { "$match": {status: type}},
    { "$limit": 6 }
  ], function (err, data) {
    if (err) {
      res.send(err);
    } else {
      res.send(data);
    }
  });
}

module.exports = router;
