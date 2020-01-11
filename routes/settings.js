module.exports = app => {
  app.get("/settings/", (req, res, next) => {
    res.json({
      priority: [1, 2, 3, 4, 5],
      status: ["New", "In Progress", "Testing", "Closed", "Rejected"],
    });
  });
};
