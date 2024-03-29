var passport=require('passport')
var GoogleStrategy = require('passport-google-oauth20').Strategy;


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3333/auth/google/callback",
    scope:['profile','email']
  },
  function(accessToken, refreshToken, profile, callback) {
    // User.findOrCreate({ googleId: profile.id }, function (err, user) {
    //   return callback(err, user);
    // });
    callback(null,profile)
    console.log(profile)
  }
));

passport.serializeUser(function(user, done) {
    done(null, user);
  });
  
  passport.deserializeUser(function(user, done) {
      done(null, user);
  });

//   passport.serializeUser(function(user, done) {
//     done(null, user.id);
//   });

//   passport.deserializeUser(function(id, done) {
//     User.findById(id, function (err, user) {
//       done(err, user);
//     });
//   });

module.exports=passport