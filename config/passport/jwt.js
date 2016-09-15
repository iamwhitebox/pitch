const mongoose = require('mongoose');

const passportJwt = require('passport-jwt');
const JwtStrategy = passportJwt.Strategy;
const ExtractJwt = passportJwt.ExtractJwt;

const config = require('../');
const User = mongoose.model('User');

var opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeader(),
    secretOrKey: 'secret',
    issuer = "accounts.examplesoft.com",
    audience = "yoursite.net"
};

passport.use(new JwtStrategy(opts, function (payload, done) {
    User.findOne({id: payload.sub}, function(err, user) {
        if (err) {
            return done(err, false);
        }
        if (user) {
            done(null, user);
        } else {
            done(null, false);
            // or you could create a new account
        }
    });
}));
