const mongoose = require("mongoose");
const Book = require("../models/Book");
const User = require("../models/User");
const Issue = require("../models/Issue");

const initdata = require("./data.js");

main()
  .then(() => {
    console.log("database connected");
    initialiseDB();
  })
  .catch((err) => {
    console.log("database connection error", err);
  });

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/Library");
}

async function initialiseDB() {
  // clear old data
  await Issue.deleteMany({});
  await Book.deleteMany({});
  await User.deleteMany({});
  console.log("existing data deleted");

  // insert users
  const users = await User.insertMany(initdata.users);

  // insert books
  const books = await Book.insertMany(initdata.books);

  // create issue records using inserted IDs
  const issues = [
    {
      userId: users[0]._id,
      bookId: books[0]._id,
      status: "issued",
    },
  ];

  await Issue.insertMany(issues);

  console.log("data inserted successfully");

  mongoose.connection.close();
}