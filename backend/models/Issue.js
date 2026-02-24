const mongoose = require("mongoose");

const Issues = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book",
    required: true,
  },
  issueDate: {
    type: Date,
    default: Date.now,
  },
  returnDate: {
    type: Date,
  },
  status: {
    type: String,
    default: "issued",
  }
});

module.exports = mongoose.model("Issue", Issues);