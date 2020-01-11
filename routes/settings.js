const passport = require("passport");

module.exports = app => {
  app.get("/settings/", (req, res, next) => {
    passport.authenticate("jwt", { session: false }, (err, user, info) => {
      if (err) {
        console.error(err);
      }
      if (info !== undefined) {
        console.error(info.message);
        res.status(403).send(info.message);
      } else {
        res.json({
          priority: [1, 2, 3, 4, 5],
          status: ["New", "In Progress", "Testing", "Closed", "Rejected"],
        });
      }
    })(req, res, next);
  });
};
