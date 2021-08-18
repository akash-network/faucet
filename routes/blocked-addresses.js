var express = require('express');
var jwtAuthz = require('express-jwt-authz');
var router = express.Router();
var db = require('../database');
var { ensureAuthenticated, ensurePermission } = require('../utils')

router.get('/', ensureAuthenticated, ensurePermission, (req, res, next) => {
  db.BlockedAddress.findAll({
    order: [ ['createdAt', 'DESC'] ],
    limit: 500
  }).then( blockedAddresses => {
    res.status(200).send(JSON.stringify(blockedAddresses));
  }).catch( err => {
    res.status(500).send(JSON.stringify(err));
  });
});

router.post('/', ensureAuthenticated, ensurePermission, async (req, res, next) => {
  const { address } = req.body
  try {
    let blocked = await db.BlockedAddress.create({ address: address.trim() })
    res.status(201).send()
  } catch (error) {
    res.status(422).send(JSON.stringify({'error': error.message}));
  }
});

router.delete('/:id', ensureAuthenticated, ensurePermission, async (req, res, next) => {
  const { id } = req.params
  try {
    await db.BlockedAddress.destroy({ where: { id } })
    res.status(204).send()
  } catch (error) {
    res.status(422).send(JSON.stringify({'error': error.message}));
  }
});

module.exports = router;
