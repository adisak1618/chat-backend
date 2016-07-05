var express = require('express');
var router = express.Router();
var authen = require('./routers/authen');
var message = require('./routers/message');

router.use('/authen', authen);
router.use('/message', message);

module.exports = router;
