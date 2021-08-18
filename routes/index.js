var express = require('express')
var router = express.Router()

var { User, latestTransactionSince } = require('../database')
var faucet = require("../faucet")

/* GET home page. */
router.get('/', async (req, res, next) => {
  const wallet = await faucet.getWallet()
  const chainId = await faucet.getChainId()
  const distributionAmount = faucet.getDistributionAmount()
  const [{ address }] = await wallet.getAccounts()
  var unlockDate

  if(req.user && req.user.id){
    let cooldownDate = new Date(new Date() - faucet.getWaitPeriod())
    transaction = await latestTransactionSince(req.user, cooldownDate)
    if(transaction) unlockDate = new Date(transaction.createdAt.getTime() + faucet.getWaitPeriod())
  }

  res.status(200).send(JSON.stringify({
    faucetAddress: address,
    unlockDate,
    chainId,
    distributionAmount
  }))
})

module.exports = router
