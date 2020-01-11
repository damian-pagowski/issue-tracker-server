const { compare } = require("bcryptjs");
const { verify } = require("jsonwebtoken");
const { createAccessToken, createRefreshToken } = require("../utils/tokens");
const REFRESH_TOKEN_COOKIE = "dupa1234";
const Users = require("../models/user");
const REFRESH_TOKEN_PATH = "/auth/auth/refresh_token";
const { check, validationResult } = require("express-validator");
const passport = require("passport");

module.exports = app => {
  app
    .get("/auth/", async (req, res, next) => {
      res.send({ ok: "ok" });
    })

    .post(
      "/auth/login",
      passport.authenticate("localddsfssdf"),
      (req, res, next) => {
        res.send({ ok: "login successful" });
      }
    )
    // .post(
    //   "/auth/login",
    //   passport.authenticate("local", {
    //     successRedirect: "/auth/",
    //     // failureRedirect: "/auth/login",
    //     failureFlash: "Invalid username or password.",
    //     successFlash: "Welcome!",
    //   }),
    //   (req, res, next) => {
    //     console.log(JSON.stringify(req));
    //     res.send({ message: "ok" });
    //   }
    // )
    // .post("/auth/login", async (req, res, next) => {
    //   const { email, password } = req.body;
    //   try {
    //     const user = await Users.findOne({ email });
    //     if (!user) {
    //       throw new Error("user not found");
    //     }
    //     const isValid = await compare(password, user.password);
    //     if (!isValid) throw new Error("invalid Password");
    //     const accessToken = createAccessToken(user.id);
    //     const refreshToken = createRefreshToken(user.id);
    //     user.refreshToken = refreshToken;
    //     user.save();
    //     sendRefreshToken(res, refreshToken);
    //     sendAccessToken(req, res, accessToken);
    //   } catch (err) {
    //     next(err);
    //   }
    // })
    .post(
      "/auth/register",
      [check("email").isEmail(), check("password").isLength({ min: 5 })],

      async (req, res, next) => {
        const errors = validationResult(req);
        // Validation - error handling
        if (!errors.isEmpty()) {
          req.flash("error_msg", "This email is already used");
          return res.status(422).json({ errors: errors.array() });
        }
        const { email, password } = req.body;
        // retrieve user from db
        const user = await Users.findOne({ email });
        if (user) {
          req.flash("error_msg", "This email is already used");
          return res.status(400).json({ error: "User already exists" });
        }

        Users.createUser(new Users({ email, password })).then(r => {
          req.flash("success_msg", "Registration succcessful");
          return res.json({ message: "user created", data: r });
        });
      }
    )
    .post("/auth/update-user", async (req, res, next) => {
      const { email, password, displayName, defaultProject } = req.body;
      try {
        const user = await Users.findOne({ email });
        if (!user) {
          throw new Error("user not found");
        }
        const isValid = await compare(password, user.password);
        if (!isValid) throw new Error("invalid Password");
        user.displayName = displayName;
        user.defaultProject = defaultProject;
        user
          .save()
          .then(data => {
            return res.send({ message: "user updated" });
          })
          .catch(error => res.status(400).json({ error: error }));
      } catch (err) {
        res.status(400).send({ error: `${err.message}` });
      }
    })
    .get("/auth/user/:email", async (req, res, next) => {
      const { email } = req.params;
      const user = await Users.findOne({ email });
      if (!user) {
        throw new Error("user not found");
      }
      const { defaultProject, displayName } = user;
      res.json({ defaultProject, displayName });
    })

    .post("/auth/logout", async (req, res, next) => {
      const { email } = req.body;
      try {
        const user = await Users.findOne({ email });
        if (!user) {
          throw new Error("user not found");
        }
        user.refreshToken = "";
        user.save();
        res.clearCookie(REFRESH_TOKEN_COOKIE, { path: REFRESH_TOKEN_PATH });
        res.send({ message: "logged out" });
      } catch (err) {
        next(err);
      }
    })
    .post("/auth/refresh_token", async (req, res) => {
      const token = req.cookies[REFRESH_TOKEN_COOKIE];
      const secret = process.env.REFRESH_TOKEN_SECRET;
      if (!token) {
        return res.status(400).send({ message: "Token cookie not set" });
      }
      let payload = null;
      try {
        payload = verify(token, secret);
      } catch (err) {
        return res.status(400).send({ message: err.message });
      }
      const user = await Users.findById(payload.userId);
      if (!user) {
        return res.send({ message: "user not found" });
      }
      if (user.refreshToken !== token) {
        return res.send({ message: "refresh token invalid" });
      }
      const accessToken = createAccessToken(user.id);
      const refreshToken = createRefreshToken(user.id);
      user.refreshToken = refreshToken;
      sendRefreshToken(res, refreshToken);
      sendAccessToken(req, res, accessToken);
    });

  const sendAccessToken = (req, res, accessToken) => {
    res.json({
      email: req.body.email,
      accessToken,
    });
  };
  const sendRefreshToken = (res, refreshToken) => {
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true,
      path: REFRESH_TOKEN_PATH,
    });
  };
};
