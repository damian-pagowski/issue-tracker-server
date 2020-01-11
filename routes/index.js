module.exports = app => {
  app.get("/", function(req, res, next) {
    res.json({ status: "UP" });
  });
};
