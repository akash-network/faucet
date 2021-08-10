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
  db.User.findAll({
    order: [
      ['createdAt', 'DESC'],
    ],
    limit: 500
  }).then( users => {
    res.status(200).send(JSON.stringify(users));
  }).catch( err => {
    res.status(500).send(JSON.stringify(err));
  });
});

module.exports = router;
