var crypto = require('crypto');
var hashPwdfn = function(salt, password) {
  var hmac = crypto.createHmac('sha1', salt);
  return hmac.update(password).digest('hex');
};
module.exports.createSalt = function() {
  return crypto.randomBytes(128).toString('base64');
};

module.exports.hashPwd = hashPwdfn;



module.exports.checkPWD = function(data, pwd) {
  if (!data) {
    return false;
  }


  var salt = data.salt;
  var password = hashPwdfn(salt, pwd);
  console.log(password);
  console.log(data.hash);
  if (!(password === data.hash)) {
    return false;
  }

  return data;
};
