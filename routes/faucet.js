var express = require('express')
var router = express.Router()

var { Transaction, latestTransactionSince } = require('../database')
var faucet = require("../faucet")

const FAUCET_AMOUNT = process.env.FAUCET_AMOUNT || 1000
const FAUCET_COOLDOWN_HOURS = process.env.FAUCET_COOLDOWN_HOURS || 24

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }
  res.redirect("/")
  // res.status(403).send(JSON.stringify({'error': 'Forbidden'}));
}

async function rateLimit(req, res, next) {
  let cooldownDate = new Date(new Date() - FAUCET_COOLDOWN_HOURS * 60 * 60 * 1000)
  let transaction = await latestTransactionSince(req.user, cooldownDate)
  if(transaction){
    return res.redirect("/?error=cooldown")
    // res.status(403).send(JSON.stringify({'error': 'Cooldown'}));
  }
  next()
}

router.post('/', ensureAuthenticated, rateLimit, async (req, res, next) => {
  const { address } = req.body

  await Transaction.create({ userId: req.user.id, address: address, amountUakt: FAUCET_AMOUNT })
  await faucet.sendTokens(address, FAUCET_AMOUNT)

  res.redirect("/")
})

module.exports = router
