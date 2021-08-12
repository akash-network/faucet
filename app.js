var express = require('express')
var jwt = require('express-jwt');
var jwksRsa = require('jwks-rsa');
var cors = require('cors');
var logger = require('morgan')

var { User } = require('./database')

var indexRouter = require('./routes/index')
var faucetRouter = require('./routes/faucet')
var usersRouter = require('./routes/users')
var transactionsRouter = require('./routes/transactions')
var blockedAddressesRouter = require('./routes/blocked-addresses')

var app = express()

const DOMAIN = process.env.AUTH0_DOMAIN
const AUDIENCE = process.env.AUTH0_AUDIENCE

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    jwksUri: `https://${DOMAIN}/.well-known/jwks.json`,
  }),
  audience: AUDIENCE,
  issuer: `https://${DOMAIN}/`,
  algorithms: ['RS256'],
  credentialsRequired: false
});

async function loadUser(req, res, next) {
  if (req.user) {
    let user = await User.findOne({ where: { sub: req.user.sub } })
    if(user) req.user = { ...req.user, ...user.dataValues }
  }
  return next()
}

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cors()); // Allow all cors (not recommended for production)
app.use(checkJwt);
app.use(loadUser);

app.use('/', indexRouter)
app.use('/faucet', faucetRouter)
app.use('/users', usersRouter)
app.use('/transactions', transactionsRouter)
app.use('/blocked-addresses', blockedAddressesRouter)

module.exports = app
