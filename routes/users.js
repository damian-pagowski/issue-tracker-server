const jwt = require("jsonwebtoken");
const Users = require("../models/user");
const { check } = require("express-validator");
const passport = require("passport");
const fetch = require("node-fetch");

const TOKEN_VALID_TIME = 60 * 60;
const TOKEN_SECRET = process.env.ACCES_TOKEN_SECRET;

module.exports = app => {
  app
    .post("/users/login", (req, res, next) => {
      const { email, password } = req.body;
      passport.authenticate("login", async (err, user, info) => {
        if (err) {
          console.error(`error ${err}`);
        }
        if (info !== undefined) {
          console.error(info.message);
          if (info.message === "bad username") {
            res.status(401).send(info.message);
          } else {
            res.status(403).send(info.message);
          }
        }
        try {
          const user = await Users.findOne({ email });
          if (!user) {
            throw new Error("user not found");
          }
          const token = jwt.sign({ id: user.id }, TOKEN_SECRET, {
            expiresIn: TOKEN_VALID_TIME,
          });
          res.status(200).send({
            email: user.email,
            id: user._id,
            token,
          });
        } catch (error) {
          next(error);
        }
      })(req, res, next);
    })
    .post(
      "/users/register",
      [check("email").isEmail(), check("password").isLength({ min: 5 })],

      (req, res, next) => {
        passport.authenticate("register", (err, user, info) => {
          if (err) {
            console.error(err);
            res.status(400).json({ error: err });
          }
          if (info !== undefined) {
            console.error(info.message);
            res.status(403).send(info.message);
          } else {
            req.logIn(user, error => {
              console.log("registration > user: " + user);
              const data = {
                email: req.body.email,
              };
              console.log(data);
              Users.findOne({
                email: data.email,
              }).then(user => {
                console.log("registration > user created in DB: " + user);
                res.status(200).send({
                  id: user._id,
                  defaultProject: user.defaultProject,
                  email: user.email,
                });
              });
            });
          }
        })(req, res, next);
      }
    )
    .get("/users/logout", (req, res, next) => {
      passport.authenticate("jwt", { session: false }, (err, user, info) => {
        if (err) {
          console.error(err);
        }
        if (info !== undefined) {
          console.error(info.message);
          res.status(403).send(info.message);
        } else {
          try {
            req.logOut();
            res.json({ message: "logout successful" });
          } catch (error) {
            console.log(error);
            res.status(400).json({ message: error });
          }
        }
      })(req, res, next);
    })
    .put("/users/:id", (req, res, next) => {
      passport.authenticate(
        "jwt",
        { session: false },
        async (err, user, info) => {
          if (err) {
            console.error(err);
          }
          if (info !== undefined) {
            console.error(info.message);
            res.status(403).send(info.message);
          } else {
            const id = req.params.id;
            const update = { ...req.body };
            if (update.hasOwnProperty("password")) {
              const hash = await Users.hashPassword(update.password);
              update.password = hash;
            }
            Users.findOneAndUpdate({ _id: id }, update, { new: true }).then(
              userInfo => {
                if (userInfo != null) {
                  userInfo;
                  res.status(200).send({
                    auth: true,
                    user: {
                      displayName: userInfo.displayName,
                      defaultProject: userInfo.defaultProject,
                      email: userInfo.email,
                    },
                  });
                } else {
                  console.error("no user exists in db to update");
                  res.status(401).send("no user exists in db to update");
                }
              }
            );
          }
        }
      )(req, res, next);
    })

    .get("/users/:id", (req, res, next) => {
      passport.authenticate(
        "jwt",
        { session: false },
        async (err, user, info) => {
          if (err) {
            console.error(err);
          }
          if (info !== undefined) {
            console.error(info.message);
            res.status(403).send(info.message);
          } else {
            const id = req.params.id;
            Users.findById(id).then(user => {
              res.json({
                displayName: user.displayName,
                defaultProject: user.defaultProject,
                email: user.email,
              });
            });
          }
        }
      )(req, res, next);
    })
    .post("/auth/github/token", async (req, res, next) => {
      const { code } = req.body;
      console.log("code: " + code);
      let error;
      if (code) {
        const access_token = await exchangeCodeToGithubToken(code);
        if (access_token) {
          const userProfile = await retrieveUserProfile(access_token);
          if (userProfile) {
            email = userProfile.email;
            console.log("email: " + email);

            const user = await Users.findOne({ email });
            console.log("user: " + JSON.stringify(user));

            if (user) {
              console.log("github oauth. user found in db");
              const token = jwt.sign({ id: user.id }, TOKEN_SECRET, {
                expiresIn: TOKEN_VALID_TIME,
              });
              res.status(200).send({
                email: user.email,
                id: user._id,
                token,
              });
            } else {
              error = "User not found in DB";
            }
          } else {
            error = "Cannot get user profile from Github";
          }
        } else {
          error = "Cannot retrieve access token from Github";
        }
      }
      if (error) {
        res.status(400).json({ error });
      }
    });
};
async function retrieveUserProfile(access_token) {
  const url_user_profile = "https://api.github.com/user";
  const userProfile = await fetch(url_user_profile, {
    headers: {
      Authorization: `token ${access_token}`,
      Accept: "application/json",
    },
  })
    .then(res => res.json())
    .then(json => {
      console.log(json);
      return json;
    });
  return userProfile;
}

async function exchangeCodeToGithubToken(code) {
  const client_id = process.env.GITHUB_CLIENT_ID;
  const client_secret = process.env.GITHUB_CLIENT_SECRET;
  const url_get_token = "https://github.com/login/oauth/access_token";
  const body = { code, client_id, client_secret };
  const access_token = await fetch(url_get_token, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  })
    .then(res => res.json())
    .then(json => {
      return json.access_token;
    });
  return access_token;
}
