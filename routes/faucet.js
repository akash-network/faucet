var express = require('express')
var router = express.Router()

var got = require('got');
var { User, Transaction, BlockedAddress, latestTransactionSince } = require('../database')
var faucet = require("../faucet")

const DOMAIN = process.env.DOMAIN
const FAUCET_AMOUNT = process.env.FAUCET_AMOUNT || 1000
const FAUCET_COOLDOWN_HOURS = process.env.FAUCET_COOLDOWN_HOURS || 24

async function ensureAuthenticated(req, res, next) {
  if (req.user) return next()
  res.status(403).send(JSON.stringify({'error': 'Forbidden'}));
}

async function rateLimit(req, res, next) {
  if(req.user.id){
    let cooldownDate = new Date(new Date() - FAUCET_COOLDOWN_HOURS * 60 * 60 * 1000)
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

router.post('/', ensureAuthenticated, blockedAddresses, rateLimit, async (req, res, next) => {
  const { address } = req.body

  try {
    if(!req.user.id){
      const {body} = await got(`https://${DOMAIN}/userinfo`, {
        headers: {
          authorization: req.headers.authorization
        },
        responseType: 'json'
      });
      let { nickname, name, email, picture } = body
      let user = await User.create({ sub: req.user.sub, nickname, name, email, picture })
      req.user = Object.assign(req.user, user.dataValues)
    }
    let transaction = await Transaction.create({ userId: req.user.id, address: address, amountUakt: FAUCET_AMOUNT })
    const result = await faucet.sendTokens(address, FAUCET_AMOUNT)
    transaction.update({transactionHash: result.transactionHash})
    res.status(201).send(JSON.stringify({'transactionHash': result.transactionHash}));
  } catch (error) {
    res.status(422).send(JSON.stringify({'error': error.message}));
  }
})

module.exports = router
