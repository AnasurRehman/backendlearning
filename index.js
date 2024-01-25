const express = require("express");
require("dotenv").config();
const app = express();

app.get("/", (req, res) => {
  res.send("hello server");
});

app.listen(process.env.PORT, () => {
  console.log(`Connected to ${process.env.PORT}`);
});
