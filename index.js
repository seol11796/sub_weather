var express = require("express");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var methodOverride = require("method-override");
var flash = require("connect-flash");
var session = require("express-session");
var passport = require("./config/passport");
var util = require("./util");
var app = express();

// DB setting
mongoose.connect(
  "mongodb+srv://seol:1218@cluster0.km1y7qr.mongodb.net/?retryWrites=true&w=majority"
);
var db = mongoose.connection;
db.once("open", function () {
  console.log("DB connected");
});
db.on("error", function (err) {
  console.log("DB ERROR : ", err);
});

// Other settings
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(flash());
app.use(session({ secret: "MySecret", resave: true, saveUninitialized: true }));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Custom Middlewares
app.use(function (req, res, next) {
  res.locals.isAuthenticated = req.isAuthenticated();
  res.locals.currentUser = req.user;
  res.locals.util = util;
  next();
});

// Routes
app.use("/", require("./routes/home"));
app.use('/users', require('./routes/users'));
app.use("/map", util.getPostQueryString, require("./routes/map"));
app.use("/station", util.getPostQueryString, require("./routes/station"));
app.use(
  "/api/complexity",
  util.getPostQueryString,
  require("./routes/complexityApi")
);
app.use(
  "/api/finedust",
  util.getPostQueryString,
  require("./routes/finedustApi")
);

// Port setting
var port = 3000;
app.listen(port, function () {
  console.log("server on! http://localhost:" + port);
});
