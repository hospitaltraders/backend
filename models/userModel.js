import mongoose from "mongoose";
import bcrypt from "bcrypt";
const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
    },
    phone: {
      type: String,
      unique: true,
      required: [true, "phone is required"],
    },
    profile_url: {
      type: String,
      unique: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true, // Allow null values to be considered unique
    },
    password: {
      type: String,
    },
    token: {
      type: String,
    },
    pincode: {
      type: String,
    },
    country: {
      type: String,
    },
    state: {
      type: String,
    },
    statename: {
      type: String,
    },
    city: {
      type: String,
    },
    address: {
      type: String,
    },
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
    ],
    status: {
      type: String,
      default: 1,
    },
    verified: {
      type: Number,
      default: 0,
    },
    profile: {
      type: String,
      default: "",
    },
    AadhaarFront: {
      type: String,
      default: "",
    },
    AadhaarBack: {
      type: String,
      default: "",
    },
    DOB: {
      type: Date,
    },
    type: {
      type: Number,
    },
    // specialization: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Specialization", // Reference to the User model for the receiver
    //   required: true,
    // },
    specialization: {
      type: Array,
    },
    experience: {
      type: Number,
    },
    fees: {
      type: Number,
    },
    gender: {
      type: Number,
    },
    MedicalRegistrationNumber: {
      type: String,
    },
    issuingMedicalCouncil: {
      type: String,
    },
    highestMedicalDegree: {
      type: String,
    },
    institutionUniversity: {
      type: String,
    },
    yearOfGraduation: {
      type: String,
    },
    jobLocation: {
      type: String,
    },
    employmentType: {
      type: String,
    },
    salaryExpectation: {
      type: String,
    },
    linkedInProfile: {
      type: String,
    },
    ProfessionalAchievements: {
      type: String,
    },

    typeHospital: {
      type: Number,
    },
    numberOfBeds: {
      type: Number,
    },
    departmentsAvailable: {
      type: Array,
    },

    interestedServices: {
      type: Array,
    },

    about: {
      type: String,
    },
    LicensingFile: {
      type: String,
      default: "",
    },
    CertificationsFile: {
      type: String,
      default: "",
    },
    ExtraCertificationsFile: {
      type: String,
      default: "",
    },
    AccreditationCertificateFile: {
      type: String,
      default: "",
    },
    OfferEquipment: {
      type: String,
    },

    Designation: {
      type: String,
      default: "",
    },
    website: {
      type: String,
    },
    NatureOfBusiness: {
      type: Array,
    },
    TypeOfProducts: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category", // Reference to the User model for the receiver
    },
    OfferRequipment: {
      type: Array,
    },
    ServiceArea: {
      type: String,
    },
    PersonApproved: {
      type: String,
    },
    ComplianceCertificateFile: {
      type: String,
      default: "",
    },
    TaxDocumentsFile: {
      type: String,
      default: "",
    },
    userId: {
      type: Number,
    },
  },
  { timestamps: true }
);

const userModel = mongoose.model("User", userSchema);

// Check if data exists, if not, create a new document with default values
const checkOrCreateDefaultData = async () => {
  try {
    const result = await userModel.findOne({ type: 0 });
    if (!result) {
      const hashedPassword = await bcrypt.hash("admin@987", 10);
      const admin = new userModel({
        username: "Administrator",
        email: "admin@gmail.com",
        phone: "9876543210",
        password: hashedPassword,
        token: hashedPassword,
        type: "0",
      });
      await admin.save();
      console.log("Admin created successfully.");
    }
  } catch (error) {
    console.error("Error checking or creating admin:", error);
  }
};

checkOrCreateDefaultData();

export default userModel;
