var passport = require('passport')
const userModel = require('../models/userModel')
const googleUserModel = require('../models/googleUserModel')

var GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3333/auth/google/callback",
  scope: ['profile', 'email']
},
  async function (accessToken, refreshToken, profile, callback) {
    // User.findOrCreate({ googleId: profile.id }, function (err, user) {
    //   return callback(err, user);
    // });
    // In a real application, you would typically save user data to a database here
    const user = await userModel.findOne({ email: profile._json.email })
    const googleUser = await googleUserModel.findOne({ email: profile._json.email })
    if (user.email) {
      callback(null, user)
      
    } else if (googleUser.email) {
      const user=googleUser
      callback(null, user)

    }else {
      const googleUserData = new googleUserModel({
        
        name: profile._json.name,
        email:profile._json.email,
        is_verified:profile._json.email_verified
      })

      const user = await googleUserData.save()
    callback(null, user)

    }
    // callback(null, profile)

    // console.log(profile)
    // console.log(profile._json.name, profile._json.email, profile._json.email_verified)
  }
));

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

module.exports = passport