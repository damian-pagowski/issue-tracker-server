require("dotenv").config();
const express = require("express");
const Cors = require("cors");
const bodyParser = require("body-parser");
const logger = require("morgan");
const passport = require("passport");
const helmet = require("helmet");
const mongoose = require("mongoose");

const app = express();
// passport
require("./config/passport");
//
app.use(Cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(logger("dev"));
// helmet
app.use(helmet());
//
app.use(passport.initialize());
// routes
require("./routes/index")(app);
require("./routes/users")(app);
require("./routes/issues")(app);
require("./routes/settings")(app);
// db connection
const DB_URI = process.env.MONGOLAB_URI;
console.log(`Connecting to database:  ${DB_URI}`);
mongoose.connect(DB_URI, { useUnifiedTopology: true, useNewUrlParser: true });
// run server
const SERVER_PORT = process.env.SERVER_PORT || 3030;
app.listen(SERVER_PORT, () => console.log(`Listening on port ${SERVER_PORT}`));
module.exports = app;
