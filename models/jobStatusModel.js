import mongoose from "mongoose";

const jobStatusSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job", // Reference to the User model for the receiver
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User model for the receiver
      required: true,
    },
    contact: {
      type: Number,
      default: 0,
    },
    status: {
      type: Number,
    },
  },
  { timestamps: true }
);

const jobStatusModel = mongoose.model("Jobstatus", jobStatusSchema);

export default jobStatusModel;
