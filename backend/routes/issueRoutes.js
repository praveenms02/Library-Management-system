const express = require("express");
const router = express.Router();

const Issue = require("../models/Issue");
const Book = require("../models/Book");
const User = require("../models/User");

const formatIssue = (issue) => ({
  id: issue._id,
  bookId: issue.bookId?._id || issue.bookId,
  bookTitle: issue.bookId?.title || "Book Deleted",
  userId: issue.userId?._id || issue.userId,
  userName: issue.userId?.name || "Unknown User",
  issueDate: issue.issueDate ? new Date(issue.issueDate).toISOString().split("T")[0] : "",
  returnDate: issue.returnDate ? new Date(issue.returnDate).toISOString().split("T")[0] : null,
  status: issue.status,
});

// Show issue page
router.get("/new", async (req, res) => {
  const books = await Book.find();
  const users = await User.find();

  res.render("issues/new", { books, users });
});

// Issue book
router.post("/", async (req, res) => {
  const { userId, userName, bookId, issueDate } = req.body;
  const book = await Book.findById(bookId);

  if (!book || book.availableCopies <= 0) {
    return res.status(400).json({ message: "Book not available" });
  }

  let resolvedUserId = userId;

  if (!resolvedUserId && userName) {
    const trimmedName = userName.trim();
    if (!trimmedName) {
      return res.status(400).json({ message: "User name is required" });
    }

    const syntheticEmail = `${trimmedName.toLowerCase().replace(/\s+/g, ".")}@library.local`;
    let user = await User.findOne({ name: trimmedName });

    if (!user) {
      user = await User.create({
        name: trimmedName,
        email: syntheticEmail,
        role: "student",
      });
    }

    resolvedUserId = user._id;
  }

  if (!resolvedUserId) {
    return res.status(400).json({ message: "User information is required" });
  }

  const existingIssue = await Issue.findOne({
    userId: resolvedUserId,
    bookId,
    status: "issued",
  });

  if (existingIssue) {
    return res
      .status(400)
      .json({ message: "User already has this book issued" });
  }

  const issue = await Issue.create({
    userId: resolvedUserId,
    bookId,
    issueDate: issueDate ? new Date(issueDate) : Date.now(),
    status: "issued",
  });

  book.availableCopies -= 1;
  await book.save();

  const populatedIssue = await Issue.findById(issue._id)
    .populate("userId")
    .populate("bookId");

  res.status(201).json(formatIssue(populatedIssue));
});

// Get all issued books
router.get("/", async (req, res) => {
  const issues = await Issue.find()
    .populate("userId")
    .populate("bookId");

  res.json(issues.map(formatIssue));
});

// Return book
const returnIssuedBook = async (req, res) => {
  const issue = await Issue.findById(req.params.id);

  if (!issue) {
    return res.status(404).json({ message: "Issued record not found" });
  }

  if (issue.status === "returned") {
    return res.status(400).json({ message: "Book already returned" });
  }

  issue.status = "returned";
  issue.returnDate = Date.now();
  await issue.save();

  const book = await Book.findById(issue.bookId);
  if (book) {
    book.availableCopies += 1;
    await book.save();
  }

  const populatedIssue = await Issue.findById(issue._id)
    .populate("userId")
    .populate("bookId");

  res.json({
    message: "Book returned successfully",
    issue: formatIssue(populatedIssue),
  });
};

router.delete("/:id", returnIssuedBook);

// Backward-compatible return route for older forms
router.post("/:id/return", returnIssuedBook);

module.exports = router;
