import mongoose from "mongoose";

const specializationSchema = new mongoose.Schema(
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

const specializationModel = mongoose.model(
  "Specialization",
  specializationSchema
);

export default specializationModel;
