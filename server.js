"use strict";

var express = require("express");
var mongo = require("mongodb");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var dns = require("dns");

var cors = require("cors");

var app = express();

// Basic Configuration
var port = process.env.PORT || 3000;

/** this project needs a db !! **/

process.env.DB_URI =
  "mongodb+srv://new-user_1:6cpgZJiKZTp4YYUP@url-short-sh73e.mongodb.net/test?retryWrites=true&w=majority";
mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const Schema = mongoose.Schema;

var urlSchema = new Schema({
  url: String,
  short: Number
});

const Url = mongoose.model("Url", urlSchema);

app.use(bodyParser.urlencoded({ extended: false }));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Header", "*");
  console.log(req.method + " " + req.path + " - " + req.ip);
  next();
});

var getShort = done => {
  Url.collection.countDocuments({}, (err, data) => {
    if (err) {
      console.log(err);
    }
    console.log(data);
    done(null, data + 1);
  });
};

var urlCheck = (url, done) => {
  dns.lookup(url, (err, address, family) => {
    if (err) {
      console.log(err);
    }
    done(null, address);
  });
};

var saveUrl = (url, id, done) => {
  var link = new Url({
    url: url,
    short: id
  });
  link.save((err, data) => {
    if (err) {
      console.log(err);
    }
    done(null, data);
  });
};

var findByShort = (num, done) => {
  Url.findOne({ short: num }, (err, data) => {
    if (err) {
      console.log(err);
    }
    done(null, data);
  });
};

app.use(cors());

app.post("/api/shorturl/new", (req, res) => {
  var url = "";
  if (/http:\/\//.test(req.body.url)) {
    url = req.body.url.replace(/http:\/\//, "");
    urlCheck(url, (err, check) => {
      if (check == undefined) {
        res.json({ error: "invalid URL" });
      }
    });
  } else if (/https:\/\//.test(req.body.url)) {
    url = req.body.url.replace(/https:\/\//, "");
    urlCheck(url, (err, check) => {
      if (check == undefined) {
        res.json({ error: "invalid URL" });
      }
    });
  } else {
    res.json({ error: "invalid URL" });
  }
  getShort((err, short) => {
    if (err) {
      console.log(err);
    }
    saveUrl(req.body.url, short, (err, data) => {
      if (err) {
        console.log(err);
      }
      res.json({ original_url: url, short_url: data.short });
    });
  });
});

app.get("/api/shorturl/:num", (req, res) => {
  console.log(parseInt(req.params.num), typeof parseInt(req.params.num));
  findByShort(parseInt(req.params.num), (err, data) => {
    if (err) {
      console.log(err);
    }
    res.redirect(data.url);
  });
});

app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", function(req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// your first API endpoint...
app.get("/api/hello", function(req, res) {
  res.json({ greeting: "hello API" });
});

app.listen(port, function() {
  console.log("Node.js listening ...");
});
