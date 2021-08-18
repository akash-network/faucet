var express = require('express');
var jwtAuthz = require('express-jwt-authz');
var router = express.Router();
var db = require('../database');
var { ensureAuthenticated, ensurePermission } = require('../utils')

router.get('/', ensureAuthenticated, ensurePermission, function(req, res, next) {
  db.User.findAll({
    order: [ ['createdAt', 'DESC'] ],
    limit: 500
  }).then( users => {
    res.status(200).send(JSON.stringify(users));
  }).catch( err => {
    res.status(500).send(JSON.stringify(err));
  });
});

module.exports = router;
