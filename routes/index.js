var express = require('express');
var router = express.Router();
var io=require('../bin/www').io
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('welcome')
});
router.get('/game', function(req, res, next) {
  res.render('game')
});
router.get('/control', function(req, res, next) {
  res.render('control')
});
router.get('/lobby', function(req, res, next) {
  res.render('lobby')
});
module.exports = router;
