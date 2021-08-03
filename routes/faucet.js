var express = require('express')
var router = express.Router()

var { Transaction } = require('../database')
var faucet = require("../faucet")

const FAUCET_AMOUNT = process.env.FAUCET_AMOUNT || 1000

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }
  res.redirect("/")
  // res.status(403).send(JSON.stringify({'error': 'Forbidden'}));
}

router.post('/', ensureAuthenticated, async (req, res, next) => {
  const { address } = req.body

  await Transaction.create({ userId: req.user.id, address: address, amountUakt: FAUCET_AMOUNT })
  await faucet.sendTokens(address, FAUCET_AMOUNT)

  res.redirect("/")
})

module.exports = router
