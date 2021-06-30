const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const UserModel = require('./models');
const JWTstrategy = require('passport-jwt').Strategy;
const ExtractJWT = require('passport-jwt').ExtractJwt;
const crypto = require('crypto');

passport.use(
  'signup',
  new localStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    async (email, password, done) => {
      try {
        /*
        const fullname="";
        const birthday="";
        const user = await UserModel.create({ email, password, fullname, birthday });
        */
        //const user = {email:email, password:password};
        const user=null;
        return done(null, user);
      } catch (error) {
        console.log(error);
        done(error);
      }
    }
  )
);
passport.use(
  'login',
  new localStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    async (email, password, done) => {
      try {
        const user = await UserModel.findOne({ email });
        if (!user) {
			console.log("note found");
          return done(null, false, { message: 'User not found' });
        }
        const md5sum = crypto.createHash('md5');
        const pwd = md5sum.update(password).digest('hex');
        //console.log ("PWD: "+pwd);
		if (user.password !==pwd) {
			console.log("invalid pwd");
          return done(null, false, { message: 'Wrong Password' });
        }
        return done(null, user, { message: 'Logged in Successfully' });
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.use(
  new JWTstrategy(
    {
      secretOrKey: 'TOP_SECRET',
      jwtFromRequest: ExtractJWT.fromUrlQueryParameter('secret_token')
    },
    async (token, done) => {
      try {
        return done(null, token.user);
      } catch (error) {
        done(error);
      }
    }
  )
);