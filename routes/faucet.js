var express = require('express')
var router = express.Router()

var faucet = require("../faucet")

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }
  res.redirect("/")
  // res.status(403).send(JSON.stringify({'error': 'Forbidden'}));
}

router.post('/', ensureAuthenticated, async (req, res, next) => {
  const { address } = req.body

  await faucet.sendTokens(address)

  res.redirect("/")
})

module.exports = router
