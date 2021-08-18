var jwtAuthz = require('express-jwt-authz');
var { BlockedAddress, latestTransactionSince } = require('./database')
var faucet = require("./faucet")

const ensurePermission = jwtAuthz([ 'manage:faucet' ], { customScopeKey: 'permissions' })

async function ensureAuthenticated(req, res, next) {
  if (req.user) return next()
  res.status(403).send(JSON.stringify({'error': 'Forbidden'}));
}

async function rateLimit(req, res, next) {
  if(req.user.id){
    let cooldownDate = new Date(new Date() - faucet.getWaitPeriod())
    let transaction = await latestTransactionSince(req.user, cooldownDate)
    if(transaction){
      return res.status(403).send(JSON.stringify({'error': 'Cooldown'}));
    }
  }
  next()
}

async function blockedAddresses(req, res, next) {
  const { address } = req.body
  if(address){
    let blocked = await BlockedAddress.findOne({ where: { address: address.trim() } })
    if(blocked){
      return res.status(403).send(JSON.stringify({'error': 'Blocked address'}));
    }
  }
  next()
}

module.exports = {
  ensurePermission,
  ensureAuthenticated,
  rateLimit,
  blockedAddresses
}
