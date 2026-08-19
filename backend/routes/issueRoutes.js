const express = require("express");
const router = express.Router();

const Issue = require("../models/Issue");
const Book = require("../models/Book");
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
  const dueDate = ["issued", "returned"].includes(issue.status) ? getDueDate(issue) : null;
  const endDate = issue.returnDate || new Date();
  const overdueDays = dueDate ? getOverdueDays(endDate, dueDate) : 0;
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
  requestedAt: issue.requestedAt,
  fineAmount: issue.status === "returned" ? issue.fineAmount : 0,
  overdueDays,
  estimatedFine,
  finePerDay: FINE_PER_DAY,
  fineCurrency: FINE_CURRENCY,
  };
};

const populateIssue = (id) => Issue.findById(id)
  .populate("userId")
  .populate("bookId");

// Request a book for admin approval.
router.post("/request", authorize("user", "student"), async (req, res) => {
  const { bookId } = req.body;
  const book = await Book.findById(bookId);

  if (!book || book.availableCopies <= 0) {
    return res.status(400).json({ message: "Book is not available" });
  }

  const existingIssue = await Issue.findOne({
    userId: req.user.userId,
    bookId,
    status: { $in: ["pending", "issued"] },
  });

  if (existingIssue) {
    return res.status(400).json({ message: "You already have a pending or issued request for this book" });
  }

  const issue = await Issue.create({
    userId: req.user.userId,
    bookId,
    status: "pending",
  });

  res.status(201).json(formatIssue(await populateIssue(issue._id)));
});

router.get("/requests", authorize("admin"), async (req, res) => {
  const issues = await Issue.find({ status: "pending" })
    .populate("userId")
    .populate("bookId")
    .sort({ createdAt: -1 });

  res.json(issues.map(formatIssue));
});

router.patch("/:id/approve", authorize("admin"), async (req, res) => {
  const issue = await Issue.findById(req.params.id);
  if (!issue || issue.status !== "pending") {
    return res.status(404).json({ message: "Pending request not found" });
  }

  const book = await Book.findById(issue.bookId);
  if (!book || book.availableCopies <= 0) {
    return res.status(400).json({ message: "Book is no longer available" });
  }

  const issueDate = new Date();
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + 15);
  issue.issueDate = issueDate;
  issue.dueDate = dueDate;
  issue.status = "issued";
  await issue.save();

  book.availableCopies -= 1;
  await book.save();

  res.json(formatIssue(await populateIssue(issue._id)));
});

router.patch("/:id/reject", authorize("admin"), async (req, res) => {
  const issue = await Issue.findOneAndUpdate(
    { _id: req.params.id, status: "pending" },
    { status: "rejected" },
    { new: true },
  );

  if (!issue) {
    return res.status(404).json({ message: "Pending request not found" });
  }

  res.json(formatIssue(await populateIssue(issue._id)));
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
    ? { status: { $in: ["issued", "returned"] } }
    : { userId: req.user.userId, status: { $in: ["pending", "issued", "returned", "rejected"] } };
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

  if (issue.status !== "issued") {
    return res.status(400).json({ message: "Only issued books can be returned" });
  }

  const isOwner = issue.userId.toString() === req.user.userId;
  if (!isOwner) {
    return res.status(403).json({ message: "You can only return your own books" });
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

router.delete("/:id", returnIssuedBook);

// Backward-compatible return route for older forms
router.post("/:id/return", returnIssuedBook);

module.exports = router;
