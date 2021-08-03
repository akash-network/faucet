var express = require('express')
var router = express.Router()

var faucet = require("../faucet")

/* GET home page. */
router.get('/', async (req, res, next) => {
  const wallet = await faucet.getWallet()
  const [{ address }] = await wallet.getAccounts()
  res.render('index', {
    title: 'Akash Faucet',
    user: req.user,
    address
  })
})

module.exports = router
