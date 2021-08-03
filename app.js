var express = require('express')
var path = require('path')
var cookieParser = require('cookie-parser')
var logger = require('morgan')

var passport = require("passport")
var session = require("express-session")

var indexRouter = require('./routes/index')
var authRouter = require('./routes/auth')
var faucetRouter = require('./routes/faucet')
var usersRouter = require('./routes/users')

var app = express()

const SESSION_SECRET = process.env.SESSION_SECRET

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

app.set('view engine', 'hbs')

app.use(
  session({ secret: SESSION_SECRET, resave: false, saveUninitialized: false })
)
app.use(passport.initialize())
app.use(passport.session())

app.use('/', indexRouter)
app.use('/auth', authRouter)
app.use('/faucet', faucetRouter)
app.use('/users', usersRouter)

module.exports = app
