const express = require("express");
const router = express.Router();
const Books = require("../models/Book");


// 📚 SHOW ALL BOOKS
router.get("/", async (req, res) => {
  const books = await Books.find();
  res.json(books);
});


// 📖 SHOW FORM TO ADD NEW BOOK
router.get("/new", (req, res) => {
  res.json({ message: "Books/new" });
});


// ➕ ADD NEW BOOK
router.post("/", async (req, res) => {
  await Books.create(req.body);
  res.json({ message: "Book added successfully" });
});


// ✏️ SHOW EDIT FORM
router.get("/:id/edit", async (req, res) => {
  const book = await Books.findById(req.params.id);
  res.json({ book });
});


// 🔄 UPDATE BOOK
router.post("/:id", async (req, res) => {
  await Books.findByIdAndUpdate(req.params.id, req.body);
  res.json({ message: "Book updated successfully" });
});


// ❌ DELETE BOOK

const Issue = require("../models/Issue");

router.post("/:id/delete", async (req, res) => {

  // check if book is currently issued
  const activeIssue = await Issue.findOne({
    bookId: req.params.id,
    status: "issued"
  });

  if (activeIssue) {
    return res.send("Cannot delete book. It is currently issued.");
  }

  await Books.findByIdAndDelete(req.params.id);
  res.json({ message: "Book deleted successfully" });
});

module.exports = router;