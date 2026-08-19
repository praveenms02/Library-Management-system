const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();

const bookRoutes = require("./routes/bookRoutes");
const issueRoutes = require("./routes/issueRoutes");
const authRoutes = require("./routes/authRoutes");

const cors = require("cors");
app.use(cors());
app.use(express.json());

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use("/auth", authRoutes);
app.use("/issues", issueRoutes);

main()
  .then(() => {
    console.log("database connected");
  })
  .catch((err) => {
    console.log("database connection error", err);
  });

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/Library");
}

app.use("/books", bookRoutes);

app.get("/", (req, res) => {
  res.send("server is working");
});

app.listen(8080, () => {
  console.log("Server is running on port 8080");
});