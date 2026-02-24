const express = require("express");
const router = express.Router();

const Issue = require("../models/Issue");
const Book = require("../models/Book");
const User = require("../models/User");


// 📚 SHOW ISSUE PAGE
router.get("/new", async (req, res) => {
  const books = await Book.find();
  const users = await User.find();

  res.render("issues/new", { books, users });
});


// 📖 ISSUE BOOK
router.post("/", async (req, res) => {
  const { userId, bookId } = req.body;
  const book = await Book.findById(bookId);
  
  if(!book || book.availableCopies <= 0) {
    return res.status(400).send("Book not available");
  }

  // 🔥 check duplicate active issue
  const existingIssue = await Issue.findOne({
    userId,
    bookId,
    status: "issued"
  });

  if (existingIssue) {
    return res.json({ message: "User already has this book issued" });
  }
  
  await Issue.create({
    userId,
    bookId,
    status: "issued"
  });
  
  if (book) {
    book.availableCopies -= 1;
    await book.save();
  }

  res.json({ message: "Book issued successfully" });
});


// 📋 SHOW ALL ISSUED BOOKS
router.get("/", async (req, res) => {
  const issues = await Issue.find()
    .populate("userId")
    .populate("bookId");


  res.json("issues/index", { issues });
});


// 🔄 RETURN BOOK
router.post("/:id/return", async (req, res) => {
  await Issue.findByIdAndUpdate(req.params.id, {
    status: "returned",
    returnDate: Date.now()
  });
  const issue = await Issue.findById(req.params.id);
  const book = await Book.findById(issue.bookId);
  if (book) {
    book.availableCopies += 1;
    await book.save();
  }

  res.json({ message: "Book returned successfully" });
});

module.exports = router;