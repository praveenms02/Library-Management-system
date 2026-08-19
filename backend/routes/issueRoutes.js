const express = require("express");
const router = express.Router();

const Issue = require("../models/Issue");
const Book = require("../models/Book");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { authenticate, authorize } = require("../middleware/auth");

router.use(authenticate);

const FINE_PER_DAY = Number(process.env.FINE_PER_DAY || 1);
const FINE_CURRENCY = process.env.FINE_CURRENCY || "USD";
const getDueDate = (issue) => issue.dueDate || new Date(new Date(issue.issueDate).setDate(new Date(issue.issueDate).getDate() + 15));
const getCalendarDay = (date) => {
  const value = new Date(date);
  return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
};
const getOverdueDays = (endDate, dueDate) => Math.max(0, Math.floor((getCalendarDay(endDate) - getCalendarDay(dueDate)) / (1000 * 60 * 60 * 24)));

const formatIssue = (issue) => {
  const dueDate = getDueDate(issue);
  const endDate = issue.returnDate || new Date();
  const overdueDays = getOverdueDays(endDate, dueDate);
  const estimatedFine = overdueDays * FINE_PER_DAY;

  return {
  id: issue._id,
  bookId: issue.bookId?._id || issue.bookId,
  bookTitle: issue.bookId?.title || "Book Deleted",
  userId: issue.userId?._id || issue.userId,
  userName: issue.userId?.name || "Unknown User",
  issueDate: issue.issueDate ? new Date(issue.issueDate).toISOString().split("T")[0] : "",
  dueDate: dueDate ? new Date(dueDate).toISOString().split("T")[0] : null,
  returnDate: issue.returnDate ? new Date(issue.returnDate).toISOString().split("T")[0] : null,
  status: issue.status,
  fineAmount: issue.status === "returned" ? issue.fineAmount : 0,
  overdueDays,
  estimatedFine,
  finePerDay: FINE_PER_DAY,
  fineCurrency: FINE_CURRENCY,
  };
};

// Show issue page
router.get("/new", authorize("admin"), async (req, res) => {
  const books = await Book.find();
  const users = await User.find();

  res.render("issues/new", { books, users });
});

// Issue book
router.post("/", authorize("admin"), async (req, res) => {
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
        password: await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 10),
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

  const resolvedIssueDate = issueDate ? new Date(issueDate) : new Date();
  const dueDate = new Date(resolvedIssueDate);
  dueDate.setDate(dueDate.getDate() + 15);
  const issue = await Issue.create({
    userId: resolvedUserId,
    bookId,
    issueDate: resolvedIssueDate,
    dueDate,
    status: "issued",
  });

  book.availableCopies -= 1;
  await book.save();

  const populatedIssue = await Issue.findById(issue._id)
    .populate("userId")
    .populate("bookId");

  res.status(201).json(formatIssue(populatedIssue));
});

router.get("/overdue", authorize("admin"), async (req, res) => {
  const issues = await Issue.find({ status: "issued", dueDate: { $lt: new Date() } })
    .populate("userId")
    .populate("bookId");

  res.json(issues.map(formatIssue));
});

// Get all issued books
router.get("/", async (req, res) => {
  const query = req.user.role === "admin"
    ? { status: "issued" }
    : { userId: req.user.userId, status: "issued" };
  const issues = await Issue.find(query)
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
  const dueDate = getDueDate(issue);
  issue.dueDate = dueDate;
  issue.fineAmount = getOverdueDays(issue.returnDate, dueDate) * FINE_PER_DAY;
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

router.delete("/:id", authorize("admin"), returnIssuedBook);

// Backward-compatible return route for older forms
router.post("/:id/return", authorize("admin"), returnIssuedBook);

module.exports = router;
