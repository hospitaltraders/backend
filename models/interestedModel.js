import mongoose from "mongoose";

const interestedSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      require: [true, "Name is required"],
    },

    status: {
      type: Number,
    },
  },
  { timestamps: true }
);

const interestedModel = mongoose.model("interested", interestedSchema);

export default interestedModel;
