var express = require('express');
var jwtAuthz = require('express-jwt-authz');
var router = express.Router();
var db = require('../database');

async function ensureAuthenticated(req, res, next) {
  if (req.user) return next()
  res.status(403).send(JSON.stringify({'error': 'Forbidden'}));
}

const ensurePermission = jwtAuthz([ 'manage:faucet' ], { customScopeKey: 'permissions' })

router.get('/', ensureAuthenticated, ensurePermission, function(req, res, next) {
  db.Transaction.findAll({
    order: [
      ['createdAt', 'DESC'],
    ],
    limit: 500,
    include: db.User
  }).then( transactions => {
    res.status(200).send(JSON.stringify(transactions));
  }).catch( err => {
    res.status(500).send(JSON.stringify(err));
  });
});

module.exports = router;
