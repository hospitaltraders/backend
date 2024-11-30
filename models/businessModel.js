import mongoose from "mongoose";

const businessSchema = new mongoose.Schema(
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

const businessModel = mongoose.model("Business", businessSchema);

export default businessModel;
