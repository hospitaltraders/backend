import mongoose from "mongoose";

const enquireSchema = mongoose.Schema(
  {
    fullname: {
      type: String,
    },
    phone: {
      type: String,
    },
    email: {
      type: String,
    },
    qty: {
      type: Number,
    },
    type: {
      type: Number,
    },
    Requirement: {
      type: String,
    },
    service: {
      type: String,
    },
    name: {
      type: String,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User model for the sender
    },
  },
  { timestamps: true }
);

const enquireModel = mongoose.model("enquire", enquireSchema);

export default enquireModel;
