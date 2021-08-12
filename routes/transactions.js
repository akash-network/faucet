var express = require('express');
var router = express.Router();
var db = require('../database');
var { ensureAuthenticated, ensurePermission } = require('../utils')

router.get('/', ensureAuthenticated, ensurePermission, function(req, res, next) {
  db.Transaction.findAll({
    order: [ ['createdAt', 'DESC'] ],
    limit: 500,
    include: db.User
  }).then( transactions => {
    res.status(200).send(JSON.stringify(transactions));
  }).catch( err => {
    res.status(500).send(JSON.stringify(err));
  });
});

module.exports = router;
