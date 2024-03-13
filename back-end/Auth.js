const passport = require('passport');

const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
    clientID: "260543759382-4gth4ab4nkf2cddrf7amcg73lrtf7of4.apps.googleusercontent.com",
    clientSecret: "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",
    callbackURL: "http://localhost:8000/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, cb,done) {

    
    return done(profile)
  }
));

passport.deserializeUser(function(user,done){
    done(null,user)
})