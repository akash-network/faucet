var express = require('express')
var router = express.Router()

var { User, latestTransactionSince } = require('../database')
var faucet = require("../faucet")

const FAUCET_COOLDOWN_HOURS = process.env.FAUCET_COOLDOWN_HOURS || 24

/* GET home page. */
router.get('/', async (req, res, next) => {
  const wallet = await faucet.getWallet()
  const [{ address }] = await wallet.getAccounts()
  let unlockDate

  if(req.user && req.user.id){
    let cooldownDate = new Date(new Date() - FAUCET_COOLDOWN_HOURS * 60 * 60 * 1000)
    transaction = await latestTransactionSince(req.user, cooldownDate)
    if(transaction) unlockDate = new Date(transaction.createdAt.getTime() + FAUCET_COOLDOWN_HOURS * 60 * 60 * 1000)
  }

  res.status(200).send(JSON.stringify({
    faucetAddress: address,
    unlockDate
  }));
})

module.exports = router
