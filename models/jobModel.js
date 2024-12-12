import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    jobtype: {
      type: Number,
    },
    jobTitle: {
      type: String,
    },
    jobRole: {
      type: String,
    },
    statename: {
      type: String,
    },
    city: {
      type: String,
    },
    jobOpen: {
      type: Number,
    },
    totalExprience: {
      type: Number,
    },
    miniExperience: {
      type: Number,
    },
    maxExperience: {
      type: Number,
    },
    minQualification: {
      type: String,
    },
    gender: {
      type: Number,
    },
    englishReq: {
      type: Number,
    },
    reLocate: {
      type: Number,
    },
    startSalary: {
      type: Number,
    },
    endSalary: {
      type: Number,
    },
    jobDescription: {
      type: String,
    },
    skill: {
      type: Array,
    },
    jobTimings: {
      type: String,
    },
    interviewDetails: {
      type: String,
    },

    c_name: {
      type: String,
    },

    p_name: {
      type: String,
    },

    phone: {
      type: Number,
    },

    email: {
      type: String,
    },

    address: {
      type: String,
    },
    personProfile: {
      type: String,
    },
    sizeOrganization: {
      type: String,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User model for the receiver
      required: true,
    },

    applyId: [
      {
        // Changed field name to plural and set type as an array of ObjectIds
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    status: {
      type: Number,
    },
  },
  { timestamps: true }
);

const jobModel = mongoose.model("Job", jobSchema);

export default jobModel;
