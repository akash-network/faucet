var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var passport = require("passport")
var session = require("express-session")
var GitHubStrategy = require("passport-github2").Strategy

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL

var db = require('./database');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'hbs');

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }
  res.redirect("/")
}

passport.serializeUser(function(user, done) {
  done(null, user)
})

passport.deserializeUser(function(obj, done) {
  done(null, obj)
})

passport.use(
  new GitHubStrategy(
    {
      clientID: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
      callbackURL: GITHUB_CALLBACK_URL
    },
    function(accessToken, refreshToken, profile, done) {
      // asynchronous verification, for effect...
      console.log({ accessToken, refreshToken, profile })

      db.User.findOne({ where: { username: profile.username } }).then(function(user){
        if (user == null){
          user = db.User.build({ username: profile.username })
        }
        user.profile = profile
        user.access_token = accessToken
        user.save().then(function(){
          return done(null, user)
        })
      })

    }
  )
)
app.use(
  session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false })
)
app.use(passport.initialize())
app.use(passport.session())

app.get("/secret", ensureAuthenticated, (req, res) => {
  res.send(`<h2>yo ${req.user.username}</h2>`)
})

app.get(
  "/auth/github",
  passport.authenticate("github", { scope: ["repo:status"] }), /// Note the scope here
  function(req, res) { }
)

app.get(
  "/auth/github/callback",
  passport.authenticate("github", { failureRedirect: "/" }),
  function(req, res) {
    res.redirect("/")
  }
)

app.use('/', indexRouter);
app.use('/users', usersRouter);

module.exports = app;
