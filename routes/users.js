var express = require('express');
var router = express.Router();
var db = require('../database');

/* GET users listing. */
router.get('/', function(req, res, next) {
  db.User.findAll()
    .then( users => {
      res.status(200).send(JSON.stringify(users));
    })
    .catch( err => {
      res.status(500).send(JSON.stringify(err));
    });
});

module.exports = router;
