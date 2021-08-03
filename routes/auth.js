var express = require('express')
var router = express.Router()
var passport = require("passport")
var GitHubStrategy = require("passport-github2").Strategy

var { User } = require('../database')

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL

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
    async function(accessToken, refreshToken, profile, done) {
      let user = await User.findOne({ where: { username: profile.username } })
      if (user == null){
        user = User.build({ username: profile.username })
      }
      user.profile = profile
      user.accessToken = accessToken
      await user.save()
      return done(null, user)
    }
  )
)

router.get(
  "/github",
  passport.authenticate("github", { scope: ["repo:status"] }), /// Note the scope here
  function(req, res) { }
)

router.get(
  "/github/callback",
  passport.authenticate("github", { failureRedirect: "/" }),
  function(req, res) {
    res.redirect("/")
  }
)

module.exports = router
