const jwt = require("jsonwebtoken");
const Users = require("../models/user");
const { check } = require("express-validator");
const passport = require("passport");

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
            auth: true,
            token,
            message: "authenticated",
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
                console.log("user created in db");
                console.log("registration > user: " + user);
                res.status(200).send({ message: "user created", data: user });
              });
            });
          }
        })(req, res, next);
      }
    );
};
