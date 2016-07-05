var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var messageSchema = new Schema({
  topic: {type: String, required: true},
  description: {type: String, required: true},
  status: Number,// 0 open, 1 close
  own_id: {
    id: {
      type: Schema.ObjectId,
      ref: 'User'
    },
    name: String
  },
  messages:[{
    messageType: String,
    message: String,
    name: String,
    user_id: {
      type: Schema.ObjectId,
      ref: 'User'
    },
    date: {type: Date, default: Date.now }
  }],
  join_list: [{
    user_id: {
      type: Schema.ObjectId,
      ref: 'User'
    },
    join_date: {type: Date, default: Date.now}

  }],

  createDate: { type: Date, default: Date.now }
});



module.exports = mongoose.model('Message', messageSchema);
