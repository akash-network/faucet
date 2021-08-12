var express = require('express')
var router = express.Router()

var got = require('got');
var { User, Transaction } = require('../database')
var faucet = require("../faucet")
var { ensureAuthenticated, blockedAddresses, rateLimit } = require('../utils')

const DOMAIN = process.env.AUTH0_DOMAIN

router.post('/', ensureAuthenticated, blockedAddresses, rateLimit, async (req, res, next) => {
  const { address } = req.body

  try {
    if(!req.user.id){
      const {body} = await got(`https://${DOMAIN}/userinfo`, {
        headers: { authorization: req.headers.authorization },
        responseType: 'json'
      });
      let { nickname, name, email, picture } = body
      let user = await User.create({ sub: req.user.sub, nickname, name, email, picture })
      req.user = Object.assign(req.user, user.dataValues)
    }
    let transaction = await Transaction.create({
      userId: req.user.id,
      address: address,
      amountUakt: faucet.getDistributionAmount()
    })
    const result = await faucet.sendTokens(address)
    transaction.update({transactionHash: result.transactionHash})
    res.status(201).send(JSON.stringify({'transactionHash': result.transactionHash}));
  } catch (error) {
    res.status(422).send(JSON.stringify({'error': error.message}));
  }
})

module.exports = router
