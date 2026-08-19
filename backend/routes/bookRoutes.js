const express = require("express");
const router = express.Router();
const Books = require("../models/Book");
const Issue = require("../models/Issue");
const { authenticate, authorize } = require("../middleware/auth");

router.use(authenticate);

// GET all books
router.get("/", async (req, res) => {
  const books = await Books.find();
  res.json(books);
});

// Create new book
router.post("/", authorize("admin"), async (req, res) => {
  const book = await Books.create(req.body);
  res.status(201).json(book);
});

// Get one book
router.get("/:id", async (req, res) => {
  const book = await Books.findById(req.params.id);
  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }
  res.json(book);
});

// Get one book for edit
router.get("/:id/edit", async (req, res) => {
  const book = await Books.findById(req.params.id);
  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }
  res.json({ book });
});

// Update book
router.put("/:id", authorize("admin"), async (req, res) => {
  const updatedBook = await Books.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!updatedBook) {
    return res.status(404).json({ message: "Book not found" });
  }
  res.json(updatedBook);
});

// Backward-compatible update route for older forms
router.post("/:id", authorize("admin"), async (req, res) => {
  const updatedBook = await Books.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!updatedBook) {
    return res.status(404).json({ message: "Book not found" });
  }
  res.json(updatedBook);
});

// Delete book
router.delete("/:id", authorize("admin"), async (req, res) => {
  const activeIssue = await Issue.findOne({
    bookId: req.params.id,
    status: "issued",
  });

  if (activeIssue) {
    return res
      .status(400)
      .json({ message: "Cannot delete book. It is currently issued." });
  }

  const deletedBook = await Books.findByIdAndDelete(req.params.id);
  if (!deletedBook) {
    return res.status(404).json({ message: "Book not found" });
  }
  res.json({ message: "Book deleted successfully" });
});

// Backward-compatible delete route for older forms
router.post("/:id/delete", authorize("admin"), async (req, res) => {
  const activeIssue = await Issue.findOne({
    bookId: req.params.id,
    status: "issued",
  });

  if (activeIssue) {
    return res
      .status(400)
      .json({ message: "Cannot delete book. It is currently issued." });
  }

  const deletedBook = await Books.findByIdAndDelete(req.params.id);
  if (!deletedBook) {
    return res.status(404).json({ message: "Book not found" });
  }
  res.json({ message: "Book deleted successfully" });
});

module.exports = router;
