const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const JWTstrategy = require("passport-jwt").Strategy;
const ExtractJWT = require("passport-jwt").ExtractJwt;
const GitHubStrategy = require("passport-github").Strategy;
const TOKEN_SECRET = process.env.ACCES_TOKEN_SECRET;
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GITHUB_CB_URL = process.env.GITHUB_CB_URL;

const Users = require("../models/user");

passport.use(
  "register",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      passReqToCallback: true,
      session: false,
    },
    (req, username, password, done) => {
      console.log(username);
      const email = req.body.email;
      console.log("Passport > Email: " + email);
      try {
        Users.findOne({ email }).then(user => {
          if (user != null) {
            console.log("user already exists");
            return done(null, false, {
              message: "user already exists",
            });
          }
          Users.createUser(new Users({ email, password })).then(user => {
            {
              console.log("createUser => " + user);
              return done(null, user);
            }
          });
        });
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.use(
  "login",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      session: false,
    },
    (username, password, done) => {
      try {
        Users.findOne({ email: req.body.email }).then(user => {
          if (user === null) {
            console.log("invalid email");
            return done(null, false, { message: "invalid email" });
          }

          user.verifyPassword(password).then(response => {
            if (response !== true) {
              console.log("passwords do not match");
              return done(null, false, { message: "passwords do not match" });
            }
            console.log("user found & authenticated");
            return done(null, user);
          });
        });
      } catch (err) {
        done(err);
      }
    }
  )
);

const opts = {
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: TOKEN_SECRET,
};

passport.use(
  "jwt",
  new JWTstrategy(opts, (jwt_payload, done) => {
    console.log(jwt_payload);
    try {
      Users.findById(jwt_payload.id).then(user => {
        if (user) {
          console.log("user found in db");
          done(null, user);
        } else {
          console.log("user not found in db");
          done(null, false);
        }
      });
    } catch (err) {
      done(err);
    }
  })
);

passport.use(
  new GitHubStrategy(
    {
      clientID: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
      callbackURL: GITHUB_CB_URL,
    },
    function(accessToken, refreshToken, profile, done) {
      const email = profile.emails[0].value;
      Users.findOne({ email })
        .then(user => {
          if (user) {
            return done(null, user);
          } else {
            return done(null, false, "user not found");
          }
        })
        .catch(error => done(error, null));
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser((id, done) =>
  Users.findById(jwt_payload.id).then((err, user) => done(err, user))
);
