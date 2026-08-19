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
  dueDate: {
    type: Date,
    default: function () {
      const dueDate = new Date(this.issueDate || Date.now());
      dueDate.setDate(dueDate.getDate() + 15);
      return dueDate;
    },
  },
  returnDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ["pending", "issued", "returned", "rejected"],
    default: "issued",
  },
  fineAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Issue", Issues);