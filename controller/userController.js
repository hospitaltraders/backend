import mongoose from "mongoose";
import blogModel from "../models/blogModel.js";
import userModel from "../models/userModel.js";
import chatModel from "../models/chatModel.js";
import categoryModel from "../models/categoryModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import attributeModel from "../models/attributeModel.js";
import productModel from "../models/productModel.js";
import orderModel from "../models/orderModel.js";
import cartModel from "../models/cartModel.js";
import homeModel from "../models/homeModel.js";
import homeLayoutModel from "../models/homeLayoutModel.js";
import ratingModel from "../models/ratingModel.js";
import wishlistModel from "../models/wishlistModel.js";
import compareModel from "../models/compareModel.js";
import zonesModel from "../models/zonesModel.js";
import promoModel from "../models/promoModel.js";
import taxModel from "../models/taxModel.js";
import Razorpay from "razorpay";
import nodemailer from "nodemailer";
import { createServer } from "http";
import querystring from "querystring";
import https from "https";
import CryptoJS from "crypto-js"; // Import the crypto module
import axios from "axios";
import { cpSync } from "fs";
import enquireModel from "../models/enquireModel.js";
import multer from "multer";
import jobModel from "../models/jobModel.js";

dotenv.config();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Define the destination folder where uploaded images will be saved
    cb(null, "public/uploads/new");
  },
  filename: function (req, file, cb) {
    // Define the filename for the uploaded image
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

export const uploadImage = upload.single("image");

// Function to pad the plaintext
function pkcs5_pad(text, blocksize) {
  const padding = blocksize - (text.length % blocksize);
  for (let i = 0; i < padding; i++) {
    text += String.fromCharCode(padding);
  }
  return text;
}

// Function to encrypt plaintext
function encrypt(plainText, key) {
  // Convert key to MD5 and then to binary
  const secretKey = CryptoJS.enc.Hex.parse(
    CryptoJS.MD5(key).toString(CryptoJS.enc.Hex)
  );
  // Initialize the initialization vector
  const initVector = CryptoJS.enc.Utf8.parse(
    Array(16)
      .fill(0)
      .map((_, i) => String.fromCharCode(i))
      .join("")
  );
  // Pad the plaintext
  const plainPad = pkcs5_pad(plainText, 16);
  // Encrypt using AES-128 in CBC mode
  const encryptedText = CryptoJS.AES.encrypt(plainPad, secretKey, {
    iv: initVector,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.NoPadding,
  });
  // Convert the ciphertext to hexadecimal
  return encryptedText.ciphertext.toString(CryptoJS.enc.Hex);
}

// Function to decrypt ciphertext
function decrypt(encryptedText, key) {
  // Convert key to MD5 and then to binary
  const secretKey = CryptoJS.enc.Hex.parse(
    CryptoJS.MD5(key).toString(CryptoJS.enc.Hex)
  );
  // Initialize the initialization vector
  const initVector = CryptoJS.enc.Utf8.parse(
    Array(16)
      .fill(0)
      .map((_, i) => String.fromCharCode(i))
      .join("")
  );
  // Convert the encryptedText from hexadecimal to binary
  const encryptedData = CryptoJS.enc.Hex.parse(encryptedText);
  // Decrypt using AES-128 in CBC mode
  const decryptedText = CryptoJS.AES.decrypt(
    { ciphertext: encryptedData },
    secretKey,
    { iv: initVector, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.NoPadding }
  );
  // Remove PKCS#5 padding
  return decryptedText
    .toString(CryptoJS.enc.Utf8)
    .replace(/[\x00-\x1F\x80-\xFF]+$/g, "");
}

function decryptURL(encryptedText, key) {
  const keyHex = CryptoJS.enc.Hex.parse(md5(key));
  const initVector = CryptoJS.enc.Hex.parse("000102030405060708090a0b0c0d0e0f");
  const encryptedHex = CryptoJS.enc.Hex.parse(encryptedText);
  const decryptedText = CryptoJS.AES.decrypt(
    { ciphertext: encryptedHex },
    keyHex,
    { iv: initVector, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.NoPadding }
  );
  return decryptedText.toString(CryptoJS.enc.Utf8);
}

const secretKey = process.env.SECRET_KEY;

// signup user

export const SignupUserImage = upload.fields([
  { name: "profile", maxCount: 1 },
  { name: "AadhaarFront", maxCount: 1 },
  { name: "AadhaarBack", maxCount: 1 },
]);

const slugify = (str) => {
  return str
    .toLowerCase() // Convert to lowercase
    .replace(/[^\w\s-]/g, "") // Remove non-alphanumeric characters
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Trim leading/trailing hyphens
};

export const SignupUserType = async (req, res) => {
  try {
    const {
      type,
      username,
      phone,
      email,
      state,
      statename,
      country,
      password,
      pincode,
      Gender,
      DOB,
      address,
      city,
    } = req.body;

    const slug = slugify(username, { lower: true, strict: true });

    // const {
    //   profile,

    //   AadhaarFront,
    //   AadhaarBack,
    // } = req.files;

    const hashedPassword = await bcrypt.hash(password, 10);

    // Calculate the auto-increment ID
    const lastUser = await userModel.findOne().sort({ _id: -1 }).limit(1);
    let userId;

    if (lastUser) {
      // Convert lastOrder.orderId to a number before adding 1
      const lastUserId = parseInt(lastUser.userId || 1);
      userId = lastUserId + 1;
    } else {
      userId = 1;
    }

    const newUser = new userModel({
      type,
      username,
      phone,
      email,
      password: hashedPassword,
      pincode,
      gender: Gender,
      DOB,
      address,
      state,
      statename,
      country,
      city,
      profile_url: slug + "-" + userId,
      // profile: profile ? profile[0].path : "",
      // AadhaarFront: AadhaarFront ? AadhaarFront[0].path : "",
      // AadhaarBack: AadhaarBack ? AadhaarBack[0].path : "",
      userId,
    });

    await newUser.save();
    res.status(201).json({
      success: true,
      message: "User signed up successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      message: `Error occurred during user signup ${error}`,
      success: false,
      error,
    });
  }
};

export const UserloginAll = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).send({
        success: false,
        message: "please fill all fields",
      });
    }
    const admin = await userModel.findOne({ email });
    if (!admin) {
      return res.status(401).send({
        success: false,
        message: "email is not registerd",
        admin,
      });
    }
    // password check

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).send({
        success: false,
        message: "password is not incorrect",
        admin,
      });
    }

    return res.status(200).send({
      success: true,
      message: "login sucesssfully",
      admin,
    });
  } catch (error) {
    return res.status(500).send({
      message: `error on login ${error}`,
      success: false,
      error,
    });
  }
};

// export const SignupUser = async (req, res) => {
//   try {
//     const { username, email, password } = req.body;

//     // Validation
//     if (!username || !email || !password) {
//       return res.status(400).json({
//         success: false,
//         message: 'Please fill all fields',
//       });
//     }

//     const existingUser = await userModel.findOne({ email });
//     if (existingUser) {
//       return res.status(401).json({
//         success: false,
//         message: 'User Already Exists',
//       });
//     }

//     // Hash the password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Create a new user
//     const user = new userModel({ username, email, password: hashedPassword });
//     const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: '1h' });
//     user.token = token; // Update the user's token field with the generated token
//     await user.save();

//     // Generate JWT token

//     res.status(201).json({
//       success: true,
//       message: 'User created successfully',
//       user,
//       token,
//     });
//   } catch (error) {
//     console.error('Error on signup:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error on signup',
//       error: error.message,
//     });
//   }
// }

export const SignupUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all fields",
      });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(401).json({
        success: false,
        message: "User Already Exists",
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const user = new userModel({ username, email, password: hashedPassword });
    const token = jwt.sign({ userId: user._id }, secretKey, {
      expiresIn: "1h",
    });
    user.token = token; // Update the user's token field with the generated token
    await user.save();

    // Generate JWT token

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user,
      token,
    });
  } catch (error) {
    console.error("Error on signup:", error);
    res.status(500).json({
      success: false,
      message: "Error on signup",
      error: error.message,
    });
  }
};

export const postman = async (req, res) => {
  const order_id = req.params.id; // Extracting order ID from params
  const merchantJsonData = {
    order_no: order_id,
  };
  const accessCode = process.env.ACCESS_CODE;
  const workingKey = process.env.WORKING_KEY;
  const merchantData = JSON.stringify(merchantJsonData);
  const encryptedData = encrypt(merchantData, workingKey);

  try {
    const response = await axios.post(
      `https://apitest.ccavenue.com/apis/servlet/DoWebTrans?enc_request=${encryptedData}&access_code=${accessCode}&request_type=JSON&response_type=JSON&command=orderStatusTracker&version=1.2`
    );

    const encResponse = response.data.split("&")[1].split("=")[1];

    const finalstatus = encResponse.replace(/\s/g, "").toString();
    console.log("`" + finalstatus + "`");
    const newStatus = await decrypt(finalstatus, workingKey);

    // Clean the string from unwanted characters
    const cleanedData = cleanDataString(newStatus);

    // Construct an object from the cleaned data string
    const newData = constructObjectFromDataString(cleanedData);

    let paymentStatus;
    let OrderStatus;

    if (newData.order_status === "Awaited") {
      paymentStatus = 2;
      OrderStatus = "1";
    }
    if (newData.order_status === "Shipped") {
      paymentStatus = 1;
      OrderStatus = "1";
    }
    if (
      newData.order_status === "Aborted" ||
      newData.order_status === undefined
    ) {
      paymentStatus = 0;
      OrderStatus = "0";
    }
    if (newData.order_status === "Initiated") {
      paymentStatus = 0;
      OrderStatus = "0";
    }

    console.log(paymentStatus, OrderStatus);

    let updateFields = {
      payment: paymentStatus,
      status: OrderStatus,
    };

    await orderModel.findOneAndUpdate(
      { orderId: req.params.id }, // Find by orderId
      updateFields,
      { new: true } // To return the updated document
    );

    res.status(200).json({
      success: true,
      message: "Response received successfully",
      data: newData, // Sending the JSON data back to the client
      key: workingKey,
    });
  } catch (error) {
    console.error("Decryption error:", error);
    res.status(500).json({
      success: false,
      message: "Error occurred while processing the request",
      error: error.message, // Sending the error message back to the client
    });
  }
};

function cleanDataString(dataString) {
  // Remove backslashes and other unwanted characters
  return dataString.replace(/\\/g, "").replace(/\u000F/g, "");
}

function constructObjectFromDataString(dataString) {
  const pairs = dataString.split('","').map((pair) => pair.split('":"'));
  const dataObject = {};
  for (const [key, value] of pairs) {
    dataObject[key] = value;
  }
  return dataObject;
}

export const Userlogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).send({
        success: false,
        message: "please fill all fields",
      });
    }
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(200).send({
        success: false,
        message: "email is not registerd",
        user,
      });
    }
    // password check

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).send({
        success: false,
        message: "password is not incorrect",
        user,
      });
    }

    const token = jwt.sign({ userId: user._id }, secretKey, {
      expiresIn: "1h",
    });

    return res.status(200).send({
      success: true,
      message: "login sucesssfully",
      user,
    });
  } catch (error) {
    return res.status(500).send({
      message: `error on login ${error}`,
      sucesss: false,
      error,
    });
  }
};

export const updateUserController = async (req, res) => {
  try {
    const { id } = req.params;
    const { phone, pincode, country, address, token } = req.body;
    console.log(phone, pincode, country, address, token);
    const user = await userModel.findByIdAndUpdate(
      id,
      { ...req.body },
      { new: true }
    );
    return res.status(200).json({
      message: "user Updated!",
      success: true,
      user,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error while updating user: ${error}`,
      success: false,
      error,
    });
  }
};

export const getAllBlogsController = async (req, res) => {
  try {
    const blogs = await blogModel
      .find({})
      .select("title image slug createdAt")
      .lean();
    if (!blogs) {
      return res.status(200).send({
        message: "NO Blogs Find",
        success: false,
      });
    }
    return res.status(200).send({
      message: "All Blogs List ",
      BlogCount: blogs.length,
      success: true,
      blogs,
    });
  } catch (error) {
    return res.status(500).send({
      message: `error while getting Blogs ${error}`,
      success: false,
      error,
    });
  }
};

export const getAllLatestBlogsController = async (req, res) => {
  try {
    const blogs = await blogModel
      .find({})
      .select("title image slug createdAt")
      .sort({ createdAt: -1 }) // Sort by the createdAt field in descending order
      .limit(4) // Limit to only the last 4 blogs
      .lean();
    if (!blogs) {
      return res.status(200).send({
        message: "NO Blogs Find",
        success: false,
      });
    }
    return res.status(200).send({
      message: "All Blogs List ",
      BlogCount: blogs.length,
      success: true,
      blogs,
    });
  } catch (error) {
    return res.status(500).send({
      message: `error while getting Blogs ${error}`,
      success: false,
      error,
    });
  }
};

export const createBlogController = async (req, res) => {
  try {
    const { title, description, image, user } = req.body;
    //validation
    if (!title || !description || !image || !user) {
      return res.status(400).send({
        success: false,
        message: "Please Provide ALl Fields",
      });
    }
    const exisitingUser = await userModel.findById(user);
    //validaton
    if (!exisitingUser) {
      return res.status(404).send({
        success: false,
        message: "unable to find user",
      });
    }

    const newBlog = new blogModel({ title, description, image, user });
    const session = await mongoose.startSession();
    session.startTransaction();
    await newBlog.save({ session });
    exisitingUser.blogs.push(newBlog);
    await exisitingUser.save({ session });
    await session.commitTransaction();
    await newBlog.save();
    return res.status(201).send({
      success: true,
      message: "Blog Created!",
      newBlog,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: "Error WHile Creting blog",
      error,
    });
  }
};

export const updateBlogController = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, image } = req.body;
    const blog = await blogModel.findByIdAndUpdate(
      id,
      { ...req.body },
      { new: true }
    );
    return res.status(200).json({
      message: "Blog Updated!",
      success: true,
      blog,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error while updating Blog: ${error}`,
      success: false,
      error,
    });
  }
};

export const getBlogIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await blogModel.findOne({ slug: id });
    if (!blog) {
      return res.status(200).send({
        message: "Blog Not Found By Id",
        success: false,
      });
    }
    return res.status(200).json({
      message: "fetch Single Blog!",
      success: true,
      blog,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error while get Blog: ${error}`,
      success: false,
      error,
    });
  }
};

export const deleteBlogController = async (req, res) => {
  try {
    const blog = await blogModel
      // .findOneAndDelete(req.params.id)
      .findByIdAndDelete(req.params.id)
      .populate("user");
    await blog.user.blogs.pull(blog);
    await blog.user.save();
    return res.status(200).send({
      success: true,
      message: "Blog Deleted!",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: "Erorr WHile Deleteing BLog",
      error,
    });
  }
};
export const userBlogsController = async (req, res) => {
  try {
    const userBlog = await userModel.findById(req.params.id).populate("blogs");
    if (!userBlog) {
      return res.status(200).send({
        message: "Blog Not Found By user",
        success: false,
      });
    }
    return res.status(200).json({
      message: " user Blog!",
      success: true,
      userBlog,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: "Erorr WHile Deleteing BLog",
      error,
    });
  }
};

export const userTokenController = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userModel.findOne({ token: id });

    if (!user) {
      return res.status(200).send({
        message: "Token expire",
        success: false,
      });
    }
    return res.status(200).send({
      message: "token Found",
      success: true,
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: "Token Not Authorise",
      error,
    });
  }
};

export const CreateChatController = async (req, res) => {
  const { firstId, secondId } = req.body;
  try {
    const chat = await chatModel.findOne({
      members: { $all: [firstId, secondId] },
    });
    if (chat) return res.status(200).json(chat);
    const newChat = new chatModel({
      members: [firstId, secondId],
    });
    const response = await newChat.save();
    res.status(200).send({
      message: "Chat Added",
      success: true,
      response,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: "Chat Not Upload",
      error,
    });
  }
};

export const findUserschatController = async (req, res) => {
  const userId = req.params.id;

  try {
    const chats = await chatModel.find({
      members: { $in: [userId] },
    });
    return res.status(200).send({
      message: "Chat Added",
      success: true,
      chats,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: "User chat Not Found",
      error,
    });
  }
};

export const findchatController = async (req, res) => {
  const { firstId, secondId } = req.params;

  try {
    const chats = await chatModel.find({
      members: { $all: [firstId, secondId] },
    });
    res.status(200).send({
      message: "Chat Added",
      success: true,
      chats,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: "User chat Not Found",
      error,
    });
  }
};

export const UsergetAllCategories = async (req, res) => {
  try {
    const categories = await categoryModel.find(
      { status: "true" },
      "_id title slug"
    );

    if (!categories) {
      return res.status(200).send({
        message: "NO Category Find",
        success: false,
      });
    }
    return res.status(200).send({
      message: "All Category List ",
      catCount: categories.length,
      success: true,
      categories,
    });
  } catch (error) {
    return res.status(500).send({
      message: `error while All Categories ${error}`,
      success: false,
      error,
    });
  }
};

export const UsergetAllProducts = async (req, res) => {
  try {
    const products = await productModel.find(
      { status: "true" },
      "_id title slug"
    );

    if (!products) {
      return res.status(200).send({
        message: "NO products Find",
        success: false,
      });
    }
    return res.status(200).send({
      message: "All products List ",
      proCount: products.length,
      success: true,
      products,
    });
  } catch (error) {
    return res.status(500).send({
      message: `error while All products ${error}`,
      success: false,
      error,
    });
  }
};

export const UsergetAllHomeProducts = async (req, res) => {
  try {
    const products = await productModel.find(
      { status: "true" },
      "_id title pImage regularPrice salePrice stock slug variant_products variations"
    );

    if (!products) {
      return res.status(200).send({
        message: "NO products Find",
        success: false,
      });
    }
    return res.status(200).send({
      message: "All products List ",
      proCount: products.length,
      success: true,
      products,
    });
  } catch (error) {
    return res.status(500).send({
      message: `error while All products ${error}`,
      success: false,
      error,
    });
  }
};

export const getAllAttributeUser = async (req, res) => {
  try {
    const Attribute = await attributeModel.find({});
    if (!Attribute) {
      return res.status(200).send({
        message: "NO Attribute Found",
        success: false,
      });
    }
    return res.status(200).send({
      message: "All Attribute List ",
      AttributeCount: Attribute.length,
      success: true,
      Attribute,
    });
  } catch (error) {
    return res.status(500).send({
      message: `error while getting attribute ${error}`,
      success: false,
      error,
    });
  }
};

export const getProductIdUser = async (req, res) => {
  try {
    const { id } = req.params;
    const Product = await productModel.findById(id);
    if (!Product) {
      return res.status(200).send({
        message: "product Not Found By Id",
        success: false,
      });
    }
    return res.status(200).json({
      message: "fetch Single product!",
      success: true,
      Product,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error while get product: ${error}`,
      success: false,
      error,
    });
  }
};

export const getProductIdUserBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const Product = await productModel.findOne({ slug: slug });
    if (!Product) {
      return res.status(200).send({
        message: "product Not Found By Id",
        success: false,
      });
    }
    return res.status(200).json({
      message: "fetch Single product!",
      success: true,
      Product,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error while get product: ${error}`,
      success: false,
      error,
    });
  }
};

// get home data

export const getHomeData = async (req, res) => {
  try {
    const homeData = await homeModel.findOne();

    if (!homeData) {
      return res.status(200).send({
        message: "Home Settings Not Found",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Found home settings!",
      success: true,
      homeData,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error while getting home settings: ${error}`,
      success: false,
      error,
    });
  }
};

// get home layout data

export const getHomeLayoutData = async (req, res) => {
  try {
    const homeLayout = await homeLayoutModel.findOne();

    if (!homeLayout) {
      return res.status(200).send({
        message: "Home Layout Not Found",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Found home Layout Data!",
      success: true,
      homeLayout,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error while getting home Layout: ${error}`,
      success: false,
      error,
    });
  }
};

export const createOrderController = async (req, res) => {
  try {
    const { items, status, mode, details, totalAmount, userId } = req.body;
    //validation
    if (!status || !mode || !details || !totalAmount) {
      return res.status(400).send({
        success: false,
        message: "Please Provide ALl Fields",
      });
    }
    const exisitingUser = await userModel.findById(userId);
    //validaton
    if (!exisitingUser) {
      return res.status(404).send({
        success: false,
        message: "unable to find user",
      });
    }

    const newOrder = new orderModel({
      items,
      status,
      mode,
      details,
      totalAmount,
    });
    const session = await mongoose.startSession();
    session.startTransaction();
    await newOrder.save({ session });
    exisitingUser.orders.push(newOrder);
    await exisitingUser.save({ session });
    await session.commitTransaction();
    await newOrder.save();
    return res.status(201).send({
      success: true,
      message: "Order Sucessfully!",
      newBlog,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: "Error WHile Creting Order",
      error,
    });
  }
};

export const updateUserAndCreateOrderController = async (req, res) => {
  let session;
  let transactionInProgress = false;

  const { id } = req.params;
  const {
    username,
    email,
    state,
    phone,
    address,
    pincode,
    details,
    discount,
    items,
    mode,
    payment,
    primary,
    shipping,
    status,
    totalAmount,
    userId,
    verified,
  } = req.body;

  try {
    session = await mongoose.startSession();
    session.startTransaction();
    transactionInProgress = true;

    // Update user
    const user = await userModel.findByIdAndUpdate(
      id,
      { username, email, pincode, address, state, verified },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Create order for the updated user
    if (!status || !mode || !details || !totalAmount || !userId || !payment) {
      return res.status(400).json({
        success: false,
        message: "Please provide all fields for the order",
      });
    }

    // Calculate the auto-increment ID

    // Calculate the auto-increment ID
    const lastOrder = await orderModel.findOne().sort({ _id: -1 }).limit(1);
    let order_id;

    if (lastOrder) {
      // Convert lastOrder.orderId to a number before adding 1
      const lastOrderId = parseInt(lastOrder.orderId);
      order_id = lastOrderId + 1;
    } else {
      order_id = 1;
    }

    // Create new order
    const newOrder = new orderModel({
      details,
      discount,
      items,
      mode,
      payment: 0,
      primary,
      shipping,
      status,
      totalAmount,
      userId,
      orderId: order_id,
    });

    await newOrder.save({ session });

    // Update user's orders
    user.orders.push(newOrder);
    await user.save({ session });

    // Update stock quantity for each product in the order
    for (const item of items) {
      const product = await productModel.findById(item.id);
      if (product) {
        product.stock -= item.quantity; // Decrement stock by the quantity ordered
        await product.save({ session });
      }
    }

    // Commit transaction
    await session.commitTransaction();
    transactionInProgress = false;

    if (mode === "COD") {
      // Send order confirmation email
      await sendOrderConfirmationEmail(email, username, userId, newOrder);
      const norder_id = newOrder.orderId;

      // block
      //  await sendOrderOTP(phone, norder_id);

      return res.status(201).json({
        success: true,
        message: "Order created successfully",
        newOrder,
        user,
        Amount: totalAmount,
        online: false,
      });
    } else {
      const tid = Math.floor(Math.random() * 1000000); // Generating random transaction ID
      const order_id = newOrder.orderId; // Generating order ID
      const accessCode = process.env.ACCESS_CODE;
      const merchant_id = process.env.MERCHANT_ID;
      const WORKING_KEY = process.env.WORKING_KEY;
      const redirect_url = process.env.REDIRECT_URL;
      const cancel_url = process.env.CANCEL_URL;

      return res.status(201).json({
        success: true,
        online: true,
        tid,
        order_id,
        accessCode,
        merchant_id,
        WORKING_KEY,
        cancel_url,
        redirect_url,
      });
    }
  } catch (error) {
    if (transactionInProgress) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        console.error("Error aborting transaction:", abortError);
      }
    }
    console.error("Error:", error);
    return res.status(400).json({
      success: false,
      message: "Error while creating order",
      error: error.message,
    });
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

export const PaymentRequest = async (req, res) => {
  try {
    const tid = Math.floor(Math.random() * 1000000); // Generating random transaction ID
    const order_id = Math.floor(Math.random() * 1000000); // Generating random order ID
    const accessCode = process.env.ACCESS_CODE;
    const merchant_id = process.env.MERCHANT_ID;
    const WORKING_KEY = process.env.WORKING_KEY;
    const redirect_url = process.env.REDIRECT_URL;
    const cancel_url = process.env.CANCEL_URL;
    // Send the data as JSON response
    res.json({
      tid,
      order_id,
      accessCode,
      merchant_id,
      WORKING_KEY,
      cancel_url,
      redirect_url,
    });
  } catch (error) {
    console.error("Error generating payment data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const PaymentResponse = async (req, res) => {
  console.log("req.body.encResp", req.body.encResp);
  const decryptdata = decrypt(req.body.encResp, process.env.WORKING_KEY);
  console.log("decryptdata", decryptdata);

  // Split the decrypted data into key-value pairs
  const keyValuePairs = decryptdata.split("&");

  // Create an object to store the key-value pairs
  const data = {};
  keyValuePairs.forEach((pair) => {
    const [key, value] = pair.split("=");
    data[key] = value;
  });

  // Extract order_id and order_status
  const orderId = data["order_id"];
  const orderStatus = data["order_status"];
  const orderAmt = Math.floor(data["amount"]);

  console.log("Order ID:", orderId);
  console.log("Order Status:", orderStatus);

  const order = await orderModel.findOne({ orderId }).populate("userId");

  const ordertotal = order.totalAmount;

  console.log("fetch data", data);
  console.log("fetch amt", orderAmt);
  console.log("order amt", ordertotal);

  if (!order) {
    console.log("order not found");
  } else {
    const user = order.userId[0]; // Assuming there's only one user associated with the order

    // Accessing user ID, username, and email
    const userId = user._id; // User ID
    const username = user.username;
    const email = user.email;
    const phone = user.phone;

    if (orderStatus === "Success" && orderAmt === ordertotal) {
      // Update payment details
      order.payment = 1;
      order.status = "1";
      // // Send order confirmation email
      await sendOrderConfirmationEmail(email, username, userId, order);

      // block
      console.log(otp);
      //   await sendOrderOTP(phone, order._id);
    } else {
      // Update payment details
      order.payment = 0;
      order.status = "0";
    }

    // Save the order details
    await order.save();
  }

  if (orderStatus === "Success") {
    // Redirect after saving data
    res.redirect(process.env.COMPLETE_STATUS);
  } else {
    res.redirect(process.env.CANCEL_STATUS);
  }
};

async function sendOrderConfirmationEmail(email, username, userId, newOrder) {
  try {
    // Configure nodemailer transporter
    const transporter = nodemailer.createTransport({
      // SMTP configuration
      host: process.env.MAIL_HOST, // Update with your SMTP host
      port: process.env.MAIL_PORT, // Update with your SMTP port
      secure: process.env.MAIL_ENCRYPTION, // Set to true if using SSL/TLS
      auth: {
        user: process.env.MAIL_USERNAME, // Update with your email address
        pass: process.env.MAIL_PASSWORD, // Update with your email password
      },
    });

    // Email message
    const mailOptions = {
      from: process.env.MAIL_FROM_ADDRESS, // Update with your email address
      to: email, // Update with your email address
      cc: process.env.MAIL_FROM_ADDRESS,
      subject: "www.cayroshop.com Order Confirmation",

      //   html: `

      //   <div class="bg-light w-100 h-100" style="background-color:#f8f9fa!important;width: 90%;font-family:sans-serif;padding:20px;border-radius:10px;padding: 100px 0px;margin: auto;">
      //   <div class="modal d-block" style="
      //      width: 500px;
      //      background: white;
      //      padding: 20px;
      //      margin: auto;
      //      border: 2px solid #8080802e;
      //      border-radius: 10px;
      //  ">
      //    <div class="modal-dialog">
      //      <div class="modal-content" style="
      //      text-align: center;
      //  ">
      //        <div class="modal-header">
      //  <h1 style="color:black;"> cayroshop <h1>
      //        </div>
      //        <div class="modal-body text-center">
      //          <h5 style="
      //      margin: 0px;
      //      margin-top: 14px;
      //      font-size: 20px;color:black;
      //  "> Order Id : #${newOrder.orderId} </h5>
      //         <p style="color:black;" >Hey ${username},</p>
      //        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="#47ca00" stroke-width="2" stroke-linecap="square" stroke-linejoin="arcs"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
      //         <h2 style="color:black;"> Your Order Is Confirmed! </h2>

      //         <p style="color:black;" > We'll send you a shipping confirmation email
      //  as soon as your order ships. </p>
      //        </div>
      //        <div class="modal-footer">

      //        <a href="https://cayroshop.com/account/order/${userId}/${newOrder._id}"  style="
      //      background: green;
      //      color: white;
      //      padding: 10px;
      //      display: block;
      //      margin: auto;
      //      border-radius: 6px;
      //      text-decoration: none;
      //  "> Track Order</a>
      //        </div>
      //      </div>
      //    </div>
      //  </div> </div>
      //   `

      html: `  <table style="margin:50px auto 10px;background-color:white;border: 2px solid #858585;padding:50px;-webkit-border-radius:3px;-moz-border-radius:3px;border-radius:3px;-webkit-box-shadow:0 1px 3px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.24);-moz-box-shadow:0 1px 3px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.24);box-shadow:0 1px 3px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.24);     font-family: sans-serif; border-top: solid 10px #ff8800;">
    <thead>
      <tr> 
      <th style="text-align:left;"> 
      <img width="200" src="https://backend-9mwl.onrender.com/uploads/new/image-1712823999415.png" />
 </th>
        <th style="text-align:right;font-weight:400;"> ${new Date(
          newOrder.createdAt
        ).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })} </th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="height:35px;"></td>
      </tr>
      <tr>
        <td colspan="2" style="border: solid 1px #ddd; padding:10px 20px;">
          <p style="font-size:14px;margin:0 0 6px 0;"><span style="font-weight:bold;display:inline-block;min-width:150px">Order status</span><b style="color:green;font-weight:normal;margin:0">Placed</b></p>
          <p style="font-size:14px;margin:0 0 6px 0;"><span style="font-weight:bold;display:inline-block;min-width:146px">Order ID</span> ${
            newOrder.orderId
          }</p>
          <p style="font-size:14px;margin:0 0 0 0;"><span style="font-weight:bold;display:inline-block;min-width:146px">Order amount</span> Rs. ${
            newOrder.totalAmount
          }</p>
          <p style="font-size:14px;margin:0 0 0 0;"><span style="font-weight:bold;display:inline-block;min-width:146px">Payment Mode</span> ${
            newOrder.mode
          }</p>
        </td>
      </tr>
      <tr>
        <td style="height:35px;"></td>
      </tr>
      <tr>
        <td  style="width:50%;padding:20px;vertical-align:top">
          <p style="margin:0 0 10px 0;padding:0;font-size:14px;"><span style="display:block;font-weight:bold;font-size:13px">Name</span> ${
            newOrder.details[0].username
          } </p>
          <p style="margin:0 0 10px 0;padding:0;font-size:14px;"><span style="display:block;font-weight:bold;font-size:13px;">Email</span>  ${
            newOrder.details[0].email
          }  </p>
      
          
        </td>
        <td style="width:50%;padding:20px;vertical-align:top">
            <p style="margin:0 0 10px 0;padding:0;font-size:14px;"><span style="display:block;font-weight:bold;font-size:13px;">Phone</span> +91-${
              newOrder.details[0].phone
            }</p>
          <p style="margin:0 0 10px 0;padding:0;font-size:14px;"><span style="display:block;font-weight:bold;font-size:13px;">Address</span> ${
            newOrder.details[0].address
          } </p>
           
          
        </td>
      </tr>
      
      <tr>
<td colspan="2" > 

<table class="table table-borderless" style="border-collapse: collapse; width: 100%;">
    <tbody>
    <tr>
        <td  style="padding: 10px;font-weight:bold;">Items</td>
        <td   style="padding: 10px;font-weight:bold;">GST</td>

        <td   style="padding: 10px;font-weight:bold;">Quantity</td>
             <td  style="padding: 10px;text-align:right;font-weight:bold;">Price</td>
      </tr>

      ${newOrder.items
        .map(
          (Pro) => `
        <tr>
          <td  style="padding: .75rem; vertical-align: top; border-top: 1px solid #dee2e6;" >
            <div className="d-flex mb-2">
              <div className="flex-shrink-0">
                <img
                  src="${Pro.image}"
                  alt=""
                  width="35"
                  className="img-fluid"
                />
              </div>
              <div className="flex-lg-grow-1 ms-3">
                <h6 className="small mb-0">
                  <a href="https://cayroshop.com/product/${Pro.id}" style="font-size:10px;">
                    ${Pro.title}  
                  </a>
                </h6>

              </div>
            </div>
          </td>
          <td  style="padding: .75rem; vertical-align: top; border-top: 1px solid #dee2e6;"> ${Pro.gst}% </td>

          <td  style="padding: .75rem; vertical-align: top; border-top: 1px solid #dee2e6;"> ${Pro.quantity} </td>

          <td  style="padding: .75rem; vertical-align: top; border-top: 1px solid #dee2e6;text-align: right;" >₹ ${Pro.price}</td>
        </tr>
        `
        )
        .join("")}

    </tbody>
    <tfoot>
        <tr>
            <td colspan="2" style="padding: .75rem; vertical-align: top; border-top: 1px solid #dee2e6;">Subtotal</td>
            <td  colspan="2"  class="text-end" style="padding: .75rem; vertical-align: top; border-top: 1px solid #dee2e6;text-align: right;">₹${
              newOrder.items.reduce(
                (total, item) => total + item.quantity * item.price,
                0
              ) -
              Math.floor(
                newOrder.items.reduce((acc, item) => {
                  const itemPrice = item.quantity * item.price;
                  const itemGST = (itemPrice * item.gst) / 100;
                  return acc + itemGST;
                }, 0)
              )
            }</td>
        </tr>

       
      
        <tr>
        <td colspan="2" style="padding: .75rem; vertical-align: top; border-top: 1px solid #dee2e6;">GST </td>
        <td colspan="2"  class="text-end" style="padding: .75rem; vertical-align: top; border-top: 1px solid #dee2e6;text-align: right;">₹${Math.floor(
          newOrder.items.reduce((acc, item) => {
            const itemPrice = item.quantity * item.price;
            const itemGST = (itemPrice * item.gst) / 100;
            return acc + itemGST;
          }, 0)
        )}</td>
    </tr>

        <tr>
            <td colspan="2" style="padding: .75rem; vertical-align: top; border-top: 1px solid #dee2e6;">Shipping</td>
            <td colspan="2"  class="text-end" style="padding: .75rem; vertical-align: top; border-top: 1px solid #dee2e6;text-align: right;">₹${
              newOrder.shipping
            }</td>
        </tr>
        <tr>
            <td colspan="2" style="padding: .75rem; vertical-align: top; border-top: 1px solid #dee2e6;">Discount</td>
            <td colspan="2"  class="text-danger text-end" style="padding: .75rem; vertical-align: top; border-top: 1px solid #dee2e6; text-align: right;">
           - ${
             newOrder.items.reduce(
               (total, item) => total + item.quantity * item.price,
               0
             ) -
               Math.abs(newOrder.discount) ===
             0
               ? "0"
               : Math.abs(newOrder.discount)
           }
          </td>
        </tr>
        <tr class="fw-bold">
            <td colspan="2" style="padding: .75rem; vertical-align: top; border-top: 1px solid #dee2e6;">TOTAL</td>
            <td colspan="2"  class="text-end" style="padding: .75rem; vertical-align: top; border-top: 1px solid #dee2e6;text-align: right;">₹${
              newOrder.totalAmount
            }</td>
        </tr>
    </tfoot>
</table>
</td>

      </tr>
    </tbody>
    <tfooter>
      <tr>
        <td colspan="2" style="font-size:14px;padding:50px 15px 0 15px;">
        
        
          <strong style="display:block;margin:0 0 10px 0;">Regards</strong> 
          
          <address><strong class="mb-2"> CAYRO ENTERPRISES </strong><br>
          <b title="Phone" class="mb-2">Web:</b>www.cayroshop.com <br></address>
         
        </td>
      </tr>
    </tfooter>
  </table> `,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Transfer-Encoding": "quoted-printable",
      },
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error("Failed to send email");
  }
}

export const EmailVerify = async (req, res) => {
  const { email } = req.body;

  // Generate a random OTP
  const OTP = Math.floor(1000 + Math.random() * 9000); // Generate a 4-digit numeric OTP

  // Configure nodemailer transporter
  const transporter = nodemailer.createTransport({
    // SMTP configuration
    host: process.env.MAIL_HOST, // Update with your SMTP host
    port: process.env.MAIL_PORT, // Update with your SMTP port
    secure: process.env.MAIL_ENCRYPTION, // Set to true if using SSL/TLS
    auth: {
      user: process.env.MAIL_USERNAME, // Update with your email address
      pass: process.env.MAIL_PASSWORD, // Update with your email password
    },
  });

  // Email message
  const mailOptions = {
    from: process.env.MAIL_FROM_ADDRESS, // Update with your email address
    to: email, // Update with your email address
    subject: "OTP Verification cayroshop.com",
    text: `OTP: ${OTP}`,
  };

  // Send email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
      res.status(500).send("Failed to send email");
    } else {
      console.log("Email sent: " + info.response);
      // If email sending is successful, return a success response
      res.status(201).json({
        success: true,
        message: "Email sent successfully",
        OTP: OTP, // Include OTP in the response if needed
      });
    }
  });
};

export const HomeSendEnquire = async (req, res) => {
  const {
    fullname,
    email,
    phone,
    service,
    QTY,
    userId,
    userEmail,
    type,
    Requirement,
    name,
    organizationName,
    designation,
    interested,
  } = req.body;
  console.log(userId, userEmail);

  try {
    // Save data to the database
    const newEnquire = new enquireModel({
      fullname,
      email,
      phone,
      service,
      QTY,
      Requirement,
      userId,
      userEmail,
      type,
      name,
      organizationName,
      designation,
      interested,
    });

    await newEnquire.save();

    // Configure nodemailer transporter
    const transporter = nodemailer.createTransport({
      // SMTP configuration
      host: process.env.MAIL_HOST, // Update with your SMTP host
      port: process.env.MAIL_PORT, // Update with your SMTP port
      secure: process.env.MAIL_ENCRYPTION, // Set to true if using SSL/TLS
      auth: {
        user: process.env.MAIL_USERNAME, // Update with your email address
        pass: process.env.MAIL_PASSWORD, // Update with your email password
      },
    });

    // Conditional recipient list
    const recipients = userEmail
      ? `${userEmail}, ${process.env.MAIL_TO_ADDRESS}`
      : process.env.MAIL_TO_ADDRESS;

    // Email message
    const mailOptions = {
      from: process.env.MAIL_FROM_ADDRESS, // Update with your email address
      to: recipients, // Update with your email address
      subject: "New Enquire Form Submission",
      text: `Name: ${fullname}\nEmail: ${email}\nPhone: ${phone}\nService: ${service}\nQTY:${QTY}`,
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        res.status(500).send("Failed to send email");
      } else {
        console.log("Email sent: " + info.response);
        res.status(200).send("Email sent successfully");
      }
    });
  } catch (error) {
    console.error("Error in send data:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const contactSendEnquire = async (req, res) => {
  const { name, email, phone, message } = req.body;

  // Configure nodemailer transporter
  const transporter = nodemailer.createTransport({
    // SMTP configuration
    host: process.env.MAIL_HOST, // Update with your SMTP host
    port: process.env.MAIL_PORT, // Update with your SMTP port
    secure: process.env.MAIL_ENCRYPTION, // Set to true if using SSL/TLS
    auth: {
      user: process.env.MAIL_USERNAME, // Update with your email address
      pass: process.env.MAIL_PASSWORD, // Update with your email password
    },
  });

  // Email message
  const mailOptions = {
    from: process.env.MAIL_FROM_ADDRESS, // Update with your email address
    to: process.env.MAIL_TO_ADDRESS, // Update with your email address
    subject: "New Contact Us Form Submission",
    text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`,
  };

  // Send email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
      res.status(500).send("Failed to send email");
    } else {
      console.log("Email sent: " + info.response);
      res.status(200).send("Email sent successfully");
    }
  });
};

export const updateUserAndCreateOrderController_old = async (req, res) => {
  let session;
  let transactionInProgress = false;
  const { id } = req.params;
  const {
    username,
    email,
    address,
    pincode,
    details,
    discount,
    items,
    mode,
    payment,
    primary,
    shipping,
    status,
    totalAmount,
    userId,
  } = req.body;

  const options = {
    amount: totalAmount * 100, // amount in smallest currency unit (e.g., paisa for INR)
    currency: "INR",
    receipt: "order_rcptid_" + Math.floor(Math.random() * 1000),
  };

  try {
    session = await mongoose.startSession();
    session.startTransaction();
    transactionInProgress = true;

    // Update user
    const user = await userModel.findByIdAndUpdate(
      id,
      { username, email, pincode, address },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Create order for the updated user
    if (!status || !mode || !details || !totalAmount || !userId || !payment) {
      console.log("status:", status);
      console.log("mode:", mode);
      console.log("details:", details);
      console.log("totalAmount:", totalAmount);
      console.log("userId:", userId);
      console.log("payment:", payment);
      console.log("shipping:", shipping);

      return res.status(400).json({
        success: false,
        message: "Please provide all fields for the order",
      });
    }

    const order = await razorpay.orders.create(options);
    const apiKey = process.env.RAZORPAY_API_KEY;

    const newOrder = new orderModel({
      details,
      discount,
      items,
      mode,
      payment: 0,
      primary,
      shipping,
      status,
      totalAmount,
      userId,
      orderId: order.id,
    });

    await newOrder.save({ session });
    user.orders.push(newOrder);
    await user.save({ session });

    // Update stock quantity for each product in the order
    for (const item of items) {
      const product = await productModel.findById(item.id);
      if (product) {
        product.stock -= item.quantity; // Decrement stock by the quantity ordered
        await product.save({ session });
      }
    }

    await session.commitTransaction();
    transactionInProgress = false;

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      newOrder,
      order,
      apiKey,
      user,
      Amount: totalAmount,
    });
  } catch (error) {
    if (transactionInProgress) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        console.error("Error aborting transaction:", abortError);
      }
    }
    console.error("Error:", error);
    return res.status(400).json({
      success: false,
      message: "Error while creating order",
      error: error.message,
    });
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

export const razorpayCallback = async (req, res) => {
  const { payment_id, order_id, status } = req.body;

  try {
    if (status === "paid") {
      // Payment successful, update order status to paid
      await orderModel.findOneAndUpdate({ orderId: order_id }, { payment: 1 });
    } else if (status === "failed") {
      // Payment failed, update order status to unpaid
      await orderModel.findOneAndUpdate({ orderId: order_id }, { payment: 2 });
    }
    res.status(200).send("Order status updated successfully.");
  } catch (error) {
    res.status(500).send("Error updating order status: " + error.message);
  }
};

//category fillter

export const GetAllCategoriesByParentIdController_old = async (req, res) => {
  try {
    const { parentId } = req.params;
    const { filter, price, page = 1, perPage = 2 } = req.query; // Extract filter, price, page, and perPage query parameters

    // Check if parentId is undefined or null
    if (!parentId) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid parent ID.",
      });
    }

    // Call the recursive function to get all categories
    const categories = await getAllCategoriesByParentId(parentId);
    const MainCat = await categoryModel
      .findById(parentId)
      .select("title description")
      .lean();

    const filters = { Category: parentId }; // Initialize filters with parent category filter

    if (filter) {
      // Parse the filter parameter
      const filterParams = JSON.parse(filter);

      // Iterate through each parameter in the filter
      Object.keys(filterParams).forEach((param) => {
        // Split parameter values by comma if present
        const paramValues = filterParams[param].split(",");

        // Check if there are multiple values for the parameter
        if (paramValues.length > 1) {
          filters[`variations.${param}.${param}`] = { $all: paramValues };
        } else {
          // If only one value, handle it as a single filter
          filters[`variations.${param}.${param}`] = { $in: paramValues };
        }
      });
    }

    // Check if price parameter is provided and not blank
    if (price && price.trim() !== "") {
      const priceRanges = price.split(","); // Split multiple price ranges by comma
      const priceFilters = priceRanges.map((range) => {
        const [minPrice, maxPrice] = range.split("-"); // Split each range into min and max prices
        return {
          salePrice: { $gte: parseInt(minPrice), $lte: parseInt(maxPrice) },
        };
      });

      // Add price filters to the existing filters
      filters.$or = priceFilters;
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * perPage;

    // Fetch products based on filters with pagination
    const products = await productModel
      .find(filters)
      .select("_id title regularPrice salePrice pImage variations")
      .skip(skip)
      .limit(perPage)
      .lean();

    const Procat = { Category: parentId }; // Initialize filters with parent category filter
    const productsFilter = await productModel
      .find(Procat)
      .select("_id regularPrice salePrice")
      .lean();

    const proLength = products.length;
    return res.status(200).json({
      success: true,
      categories,
      MainCat,
      products,
      proLength,
      productsFilter,
    });
  } catch (error) {
    console.error("Error in GetAllCategoriesByParentIdController:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const GetAllCategoriesByParentIdController = async (req, res) => {
  try {
    const { parentId } = req.params;
    const { filter, price, page = 1, perPage = 2 } = req.query; // Extract filter, price, page, and perPage query parameters

    // Check if parentId is undefined or null
    if (!parentId) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid parent ID.",
      });
    }

    // Call the recursive function to get all categories
    const categories = await getAllCategoriesByParentId(parentId);
    const MainCat = await categoryModel
      .findById(parentId)
      .select("title metaTitle metaDescription metaKeywords image description")
      .lean();

    const filters = { Category: parentId }; // Initialize filters with parent category filter

    if (filter) {
      // Parse the filter parameter
      const filterParams = JSON.parse(filter);

      // Iterate through each parameter in the filter
      Object.keys(filterParams).forEach((param) => {
        // Split parameter values by comma if present
        const paramValues = filterParams[param].split(",");
        const variationsKey = `variations.${param}.${param}`;

        // Handle multiple values for the parameter
        filters[variationsKey] = { $in: paramValues };
      });
    }

    // Check if price parameter is provided and not blank
    if (price && price.trim() !== "") {
      const priceRanges = price.split(","); // Split multiple price ranges by comma
      const priceFilters = priceRanges.map((range) => {
        const [minPrice, maxPrice] = range.split("-"); // Split each range into min and max prices
        return {
          salePrice: { $gte: parseInt(minPrice), $lte: parseInt(maxPrice) },
        };
      });

      // Add price filters to the existing filters
      filters.$or = priceFilters;
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * perPage;

    // Fetch products based on filters with pagination
    const products = await productModel
      .find(filters)
      .select("_id title regularPrice salePrice pImage variations")
      .skip(skip)
      .limit(perPage)
      .lean();

    const Procat = { Category: parentId }; // Initialize filters with parent category filter
    const productsFilter = await productModel
      .find(Procat)
      .select("_id regularPrice salePrice variations")
      .lean();

    const proLength = products.length;
    return res.status(200).json({
      success: true,
      categories,
      MainCat,
      products,
      proLength,
      productsFilter,
    });
  } catch (error) {
    console.error("Error in GetAllCategoriesByParentIdController:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// export const GetAllCategoriesBySlugController = async (req, res) => {
//   try {
//     const { parentSlug } = req.params;
//     const { filter, price, page = 1, perPage = 2 } = req.query; // Extract filter, price, page, and perPage query parameters

//     // Check if parentId is undefined or null
//     if (!parentSlug) {
//       return res.status(400).json({
//         success: false,
//         message: "Please provide a valid parent ID.",
//       });
//     }

//     // Call the recursive function to get all categories
//     const MainCat = await categoryModel
//       .findOne({ slug: parentSlug, status: "true" })
//       .select(
//         "title metaTitle metaDescription metaKeywords image description specifications slide_head slide_para"
//       )
//       .lean();

//     const parentId = MainCat._id;
//     console.log(parentId, parentSlug);

//     const categories = await getAllCategoriesByParentId(parentId);

//     const filters = { Category: parentId }; // Initialize filters with parent category filter

//     if (filter) {
//       // Parse the filter parameter
//       const filterParams = JSON.parse(filter);

//       // Iterate through each parameter in the filter
//       Object.keys(filterParams).forEach((param) => {
//         // Split parameter values by comma if present
//         const paramValues = filterParams[param].split(",");
//         const variationsKey = `variations.${param}.${param}`;

//         // Handle multiple values for the parameter
//         filters[variationsKey] = { $in: paramValues };
//       });
//     }

//     // Check if price parameter is provided and not blank
//     if (price && price.trim() !== "") {
//       const priceRanges = price.split(","); // Split multiple price ranges by comma
//       const priceFilters = priceRanges.map((range) => {
//         const [minPrice, maxPrice] = range.split("-"); // Split each range into min and max prices
//         return {
//           salePrice: { $gte: parseInt(minPrice), $lte: parseInt(maxPrice) },
//         };
//       });

//       // Add price filters to the existing filters
//       filters.$or = priceFilters;
//     }

//     // Calculate skip value for pagination
//     const skip = (page - 1) * perPage;

//     // Fetch products based on filters with pagination
//     const products = await productModel
//       .find(filters)
//       .select("_id title regularPrice salePrice pImage variations")
//       .skip(skip)
//       .limit(perPage)
//       .lean();

//     const Procat = { Category: parentId }; // Initialize filters with parent category filter
//     const productsFilter = await productModel
//       .find(Procat)
//       .select("_id regularPrice salePrice variations")
//       .lean();

//     const proLength = products.length;
//     return res.status(200).json({
//       success: true,
//       categories,
//       MainCat,
//       products,
//       proLength,
//       productsFilter,
//     });
//   } catch (error) {
//     console.error("Error in GetAllCategoriesByParentIdController:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//     });
//   }
// };

// export const getAllCategoriesByParentId = async (parentId) => {
//   try {
//     const categories = await categoryModel.find({ parent: parentId }).lean();

//     if (!categories || categories.length === 0) {
//       return [];
//     }

//     const result = [];

//     for (const category of categories) {
//       const { _id, title, image, slug /* other fields */ } = category;

//       const categoryData = {
//         _id,
//         title,
//         image,
//         subcategories: await getAllCategoriesByParentId(_id), // Recursive call
//         slug,
//       };

//       result.push(categoryData);
//     }

//     return result;
//   } catch (error) {
//     console.error("Error while fetching categories:", error);
//     throw error;
//   }
// };

export const GetAllCategoriesBySlugController = async (req, res) => {
  try {
    const { parentSlug } = req.params;
    const { filter, price, page = 1, perPage = 2 } = req.query;

    // Check if parentSlug is undefined or null
    if (!parentSlug) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid parent ID.",
      });
    }

    // Fetch the main category with status check
    const MainCat = await categoryModel
      .findOne({ slug: parentSlug, status: "true" })
      .select(
        "title metaTitle metaDescription metaKeywords image description specifications slide_head slide_para filter"
      )
      .lean();

    // Check if the MainCat exists
    if (!MainCat) {
      return res.status(404).json({
        success: false,
        message: "Category not found or inactive.",
      });
    }

    const parentId = MainCat._id;
    const categories = await getAllCategoriesByParentId(parentId);

    const filters = { Category: parentId, status: "true" }; // Add status filter for products

    if (filter) {
      const filterParams = JSON.parse(filter);
      Object.keys(filterParams).forEach((param) => {
        const paramValues = filterParams[param].split(",");
        const variationsKey = `variations.${param}.${param}`;
        filters[variationsKey] = { $in: paramValues };
      });
    }

    // Check if price parameter is provided
    if (price && price.trim() !== "") {
      const priceRanges = price.split(",");
      const priceFilters = priceRanges.map((range) => {
        const [minPrice, maxPrice] = range.split("-");
        return {
          salePrice: { $gte: parseInt(minPrice), $lte: parseInt(maxPrice) },
          status: "true", // Ensure products are active
        };
      });

      filters.$or = priceFilters;
    }

    const skip = (page - 1) * perPage;

    // Fetch products based on filters with pagination
    const products = await productModel
      .find(filters)
      .select("_id title regularPrice salePrice pImage variations")
      .skip(skip)
      .limit(perPage)
      .populate({
        path: "userId", // Populate the userId field
        select: "_id username statename city verified email", // Specify only the fields to populate
      })
      .lean();

    const Procat = { Category: parentId, status: "true" }; // Add status filter for products
    const productsFilter = await productModel
      .find(Procat)
      .select("_id regularPrice salePrice variations")
      .lean();

    const proLength = products.length;
    return res.status(200).json({
      success: true,
      categories,
      MainCat,
      products,
      proLength,
      productsFilter,
    });
  } catch (error) {
    console.error("Error in GetAllCategoriesBySlugController:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getAllCategoriesByParentId = async (parentId) => {
  try {
    const categories = await categoryModel
      .find({ parent: parentId, status: "true" })
      .lean(); // Check status

    if (!categories || categories.length === 0) {
      return [];
    }

    const result = [];

    for (const category of categories) {
      const { _id, title, image, slug } = category;

      const categoryData = {
        _id,
        title,
        image,
        subcategories: await getAllCategoriesByParentId(_id), // Recursive call
        slug,
      };

      result.push(categoryData);
    }

    return result;
  } catch (error) {
    console.error("Error while fetching categories:", error);
    throw error;
  }
};

export const userOrdersController = async (req, res) => {
  try {
    const userOrder = await userModel.findById(req.params.id).populate({
      path: "orders",
      select: "_id createdAt totalAmount status mode orderId", // Select only _id and title fields
      options: {
        sort: { createdAt: -1 }, // Sort by createdAt field in descending order
      },
    });

    if (!userOrder) {
      return res.status(200).send({
        message: "Order Not Found By user",
        success: false,
      });
    }
    return res.status(200).json({
      message: " user Orders!",
      success: true,
      userOrder,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: "Error WHile Getting Orders",
      error,
    });
  }
};

export const userOrdersViewController = async (req, res) => {
  try {
    const { userId, orderId } = req.params;

    // Find the user by ID and populate their orders
    const userOrder = await userModel.findById(userId).populate({
      path: "orders",
      match: { _id: orderId }, // Match the order ID
    });

    // If user or order not found, return appropriate response
    if (!userOrder || !userOrder.orders.length) {
      return res.status(404).json({
        message: "Order Not Found By user or Order ID",
        success: false,
      });
    }

    // If user order found, return success response with the single order
    return res.status(200).json({
      message: "Single Order Found By user ID and Order ID",
      success: true,
      userOrder: userOrder.orders[0], // Assuming there's only one order per user
    });
  } catch (error) {
    // If any error occurs during the process, log it and return error response
    console.log(error);
    return res.status(400).json({
      success: false,
      message: "Error while getting order",
      error,
    });
  }
};

export const AddCart = async (req, res) => {
  try {
    const { items, isEmpty, totalItems, totalUniqueItems, cartTotal } =
      req.body;

    const Cart = new cartModel({
      items,
      isEmpty,
      totalItems,
      totalUniqueItems,
      cartTotal,
    });
    await Cart.save();

    res.status(201).json({
      success: true,
      message: "User created successfully",
      Cart,
    });
  } catch (error) {
    console.error("Error on signup:", error);
    res.status(500).json({
      success: false,
      message: "Error on signup",
      error: error.message,
    });
  }
};

export const UpdateCart = async (req, res) => {
  try {
    const { id } = req.params;
    const { items, isEmpty, totalItems, totalUniqueItems, cartTotal } =
      req.body;
    const Cart = await cartModel.findByIdAndUpdate(
      id,
      { ...req.body },
      { new: true }
    );
    return res.status(200).json({
      message: "Cart Updated!",
      success: true,
      Cart,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error while updating cart: ${error}`,
      success: false,
      error,
    });
  }
};

export const getCart = async (req, res) => {
  try {
    const { id } = req.params;
    const Cart = await cartModel.findById(id);
    if (!Cart) {
      return res.status(200).send({
        message: "Cart Not Found",
        success: false,
      });
    }
    return res.status(200).json({
      message: "Cart Found successfully!",
      success: true,
      Cart,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error while get cart: ${error}`,
      success: false,
      error,
    });
  }
};

export const AddRating = async (req, res) => {
  try {
    const { userId, rating, comment, productId } = req.body;

    // Validation
    if (!userId || !rating || !comment || !productId) {
      return res.status(400).json({
        success: false,
        message: "Please fill all fields",
      });
    } else {
      // Create a new user rating instance
      const newUserRating = new ratingModel({
        userId,
        rating,
        comment,
        productId,
      });

      // Save the user rating to the database
      await newUserRating.save();

      return res.status(200).json({
        message: "User rating created successfully!",
        success: true,
        newUserRating,
      });
    }
  } catch (error) {
    return res.status(400).json({
      message: `Error while add rating: ${error}`,
      success: false,
      error,
    });
  }
};

export const ViewProductRating = async (req, res) => {
  try {
    const productId = req.params.id;

    // Find all ratings for a specific product
    const productRatings = await ratingModel.find({ productId, status: 1 });

    // Fetch user details for each rating
    const ratingsWithUserDetails = await Promise.all(
      productRatings.map(async (rating) => {
        const user = await userModel.findById(rating.userId);
        return {
          rating: rating.rating,
          comment: rating.comment,
          username: user ? user.username : "Unknown",
          createdAt: rating.createdAt,
          userId: user ? user._id : "Unknown",
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: "Getting product ratings successfully!",
      productRatings: ratingsWithUserDetails,
    });
  } catch (error) {
    console.error("Error getting product ratings:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const ViewCategoryRating = async (req, res) => {
  try {
    // Query the database for all ratings where status is 1
    const ratings = await ratingModel.find({ status: 1 });

    res.status(200).json({ success: true, ratings });
  } catch (error) {
    console.error("Error fetching ratings:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// add Wishlist by user
export const AddWishListByUser = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    // Validation
    if (!userId || !productId) {
      return res.status(400).json({
        success: false,
        message: "Please provide both userId & productId",
      });
    }

    // Check if the wishlist item already exists for the user
    const existingWishlistItem = await wishlistModel.findOne({
      userId,
      productId,
    });

    if (existingWishlistItem) {
      return res.status(400).json({
        success: false,
        message: "Wishlist item already exists",
      });
    }

    // Create a new wishlist item
    const newWishlistItem = new wishlistModel({
      userId,
      productId,
    });

    // Save the wishlist item to the database
    await newWishlistItem.save();

    return res.status(200).json({
      message: "Wishlist item created successfully!",
      success: true,
      newWishlistItem,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error while adding wishlist item: ${error}`,
      success: false,
      error,
    });
  }
};

export const ViewWishListByUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Find wishlist items for the specified user ID
    const wishlistItems = await wishlistModel.find({ userId });

    // Extract product IDs from wishlist items
    const productIds = wishlistItems.map((item) => item.productId);

    // Fetch product details for each product ID
    const productDetails = await productModel
      .find({ _id: { $in: productIds } })
      .select("_id pImage regularPrice salePrice title");

    // Combine wishlist items with product details
    const wishlistWithProductDetails = wishlistItems.map((item) => {
      const productDetail = productDetails.find(
        (product) => product._id.toString() === item.productId.toString()
      );
      return {
        _id: item._id,
        userId: item.userId,
        productId: item.productId,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        productDetail: productDetail, // Add product details to wishlist item
      };
    });

    return res.status(200).json({
      success: true,
      message: "Getting wishlist successfully!",
      wishlist: wishlistWithProductDetails,
    });
  } catch (error) {
    console.error("Error getting wishlist:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const deleteWishListByUser = async (req, res) => {
  try {
    await wishlistModel.findByIdAndDelete(req.params.id);

    return res.status(200).send({
      success: true,
      message: "Wishlist Deleted!",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: "Erorr WHile Deleteing Wishlist",
      error,
    });
  }
};

export const AddCompareByUser = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    // Validation
    if (!userId || !productId) {
      return res.status(400).json({
        success: false,
        message: "Please fill userId & productId",
      });
    } else {
      // Check if the wishlist item already exists for the user
      const existingWishlistItem = await compareModel.findOne({
        userId,
        productId,
      });

      if (existingWishlistItem) {
        return res.status(400).json({
          success: false,
          message: "Comparsion item already exists",
        });
      }
      const entryCount = await compareModel.countDocuments({ userId });

      if (entryCount >= 3) {
        return res.status(400).json({
          success: false,
          message: "Sorry You Can't Add More Than 3 Products",
        });
      }

      // Create a new user rating instance
      const newUserCompare = new compareModel({
        userId,
        productId,
      });

      // Save the user rating to the database
      await newUserCompare.save();

      return res.status(200).json({
        message: "User comparsion created successfully!",
        success: true,
        newUserCompare,
      });
    }
  } catch (error) {
    return res.status(400).json({
      message: `Error while add comparsion: ${error}`,
      success: false,
      error,
    });
  }
};

export const ViewCompareByUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Find wishlist items for the specified user ID
    const CompareItems = await compareModel.find({ userId });

    // Extract product IDs from wishlist items
    const productIds = CompareItems.map((item) => item.productId);

    // Fetch product details for each product ID
    const productDetails = await productModel
      .find({ _id: { $in: productIds } })
      .select("_id pImage regularPrice salePrice title specifications");

    // Combine wishlist items with product details
    const CompareWithProductDetails = CompareItems.map((item) => {
      const productDetail = productDetails.find(
        (product) => product._id.toString() === item.productId.toString()
      );
      return {
        _id: item._id,
        userId: item.userId,
        productId: item.productId,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        productDetail: productDetail, // Add product details to wishlist item
      };
    });

    return res.status(200).json({
      success: true,
      message: "Getting Compare successfully!",
      comparsion: CompareWithProductDetails,
    });
  } catch (error) {
    console.error("Error getting Compare:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const deleteCompareByUser = async (req, res) => {
  try {
    await compareModel.findByIdAndDelete(req.params.id);

    return res.status(200).send({
      success: true,
      message: "Compare Deleted!",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: "Erorr WHile Deleteing Compare",
      error,
    });
  }
};

export const ViewOrderByUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Find userItems items for the specified user ID
    const userItems = await userModel.find({ userId });

    // Extract product IDs from userItems items
    const productIds = userItems.map((item) => item.productId);

    // Fetch product details for each product ID
    const productDetails = await orderModel
      .find({ _id: { $in: productIds } })
      .select("_id username email phone pincode country address status");

    // Combine userItems items with product details
    const UsertWithProductDetails = userItems.map((item) => {
      const productDetail = productDetails.find(
        (product) => product._id.toString() === item.productId.toString()
      );
      return {
        _id: item._id,
        userId: item.userId,
        productId: item.productId,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        productDetail: productDetail, // Add product details to wishlist item
      };
    });

    return res.status(200).json({
      success: true,
      message: "Getting wishlist successfully!",
      wishlist: wishlistWithProductDetails,
    });
  } catch (error) {
    console.error("Error getting wishlist:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// for zones

export const ViewAllZones = async (req, res) => {
  try {
    // Query the database for all ratings where status is 1
    const Zones = await zonesModel.find({ status: "true" });

    res.status(200).json({ success: true, Zones });
  } catch (error) {
    console.error("Error fetching ratings:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const ViewAllUserTaxes = async (req, res) => {
  try {
    // Query the database for all ratings where status is 1
    const taxes = await taxModel.find({ status: "true" });

    res.status(200).json({ success: true, taxes });
  } catch (error) {
    console.error("Error fetching ratings:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getTaxIdUser = async (req, res) => {
  try {
    const { id } = req.params;
    const taxes = await taxModel.find({ zoneId: id });
    if (!taxes || taxes.length === 0) {
      return res.status(200).send({
        message: "No taxes found for the specified zoneId",
        success: false,
      });
    }
    // Get the last element from the taxes array
    const lastTax = taxes[taxes.length - 1];
    return res.status(200).json({
      message: "Fetched last tax by zoneId successfully",
      success: true,
      tax: lastTax,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error while getting taxes: ${error}`,
      success: false,
      error,
    });
  }
};

export const applyPromoCode = async (req, res) => {
  try {
    const { promoCode } = req.body;
    console.log("promoCode", req.body.promoCode);
    // Find the promo code in the database
    const promo = await promoModel.findOne({ name: promoCode });

    if (!promo) {
      return res.status(400).json({ message: "Promo code not found" });
    }

    // Check if the promo code is valid and active
    if (promo.status !== "true") {
      return res.status(400).json({ message: "Promo code is not active" });
    }

    // Apply the promo code based on its type
    let discount = 0;
    let type = "";

    if (promo.type === 1) {
      // Percentage
      // Calculate discount percentage
      discount = parseFloat(promo.rate) / 100;
      type = "percentage";
    } else if (promo.type === 2) {
      // Fixed Amount
      // Assume type is 'value', calculate discount value
      discount = parseFloat(promo.rate);
      type = "fixed";
    } else {
      return res.status(400).json({ message: "Invalid promo code type" });
    }

    // Return the discount and type to the client
    return res.status(200).json({ discount, type });
  } catch (error) {
    console.error("Error applying promo code:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const sendRegOTP = async (phone, otp) => {
  try {
    // Construct the request URL with query parameters
    const queryParams = querystring.stringify({
      username: "cayro.trans",
      password: "CsgUK",
      unicode: false,
      from: "CAYROE",
      to: phone,
      text: `Here is your OTP ${otp} for registering your account on cayroshop.com`,
    });
    const url = `https://pgapi.smartping.ai/fe/api/v1/send?${queryParams}`;

    // Make the GET request to send OTP
    https
      .get(url, (res) => {
        console.log(`OTP API response status code: ${res.statusCode}`);
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          console.log(`Response body: ${chunk}`);
        });
      })
      .on("error", (error) => {
        // console.log('url', url)
        console.error("Error sending OTP:", error);
        throw new Error("Failed to send OTP");
      });

    console.log("OTP request sent successfully");
  } catch (error) {
    // Handle errors
    console.error("Error sending OTP:", error);
    throw new Error("Failed to send OTP");
  }
};

const sendLogOTP = async (phone, otp) => {
  try {
    // Construct the request URL with query parameters
    const queryParams = querystring.stringify({
      username: "cayro.trans",
      password: "CsgUK",
      unicode: false,
      from: "CAYROE",
      to: phone,
      text: `Here is OTP ${otp} for mobile no verification in website cayroshop.com`,
    });
    const url = `https://pgapi.smartping.ai/fe/api/v1/send?${queryParams}`;

    console.log(url);
    // Make the GET request to send OTP
    https
      .get(url, (res) => {
        console.log(`OTP API response status code: ${res.statusCode}`);
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          console.log(`Response body: ${chunk}`);
        });
      })
      .on("error", (error) => {
        // console.log('url', url)
        console.error("Error sending OTP:", error);
        throw new Error("Failed to send OTP");
      });

    console.log("OTP request sent successfully");
  } catch (error) {
    // Handle errors
    console.error("Error sending OTP:", error);
    throw new Error("Failed to send OTP");
  }
};

const sendOrderOTP = async (phone, order_id) => {
  try {
    // Construct the request URL with query parameters
    const queryParams = querystring.stringify({
      username: "cayro.trans",
      password: "CsgUK",
      unicode: false,
      from: "CAYROE",
      to: phone,
      text: `Thank you for your order. Your order id is ${order_id} cayroshop.com`,
    });
    const url = `https://pgapi.smartping.ai/fe/api/v1/send?${queryParams}`;

    console.log(url);
    // Make the GET request to send OTP
    https
      .get(url, (res) => {
        console.log(`OTP API response status code: ${res.statusCode}`);
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          console.log(`Response body: ${chunk}`);
        });
      })
      .on("error", (error) => {
        // console.log('url', url)
        console.error("Error sending OTP:", error);
        throw new Error("Failed to send OTP");
      });

    console.log("OTP request sent successfully");
  } catch (error) {
    // Handle errors
    console.error("Error sending OTP:", error);
    throw new Error("Failed to send OTP");
  }
};

export const SendOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000);
    // Send OTP via Phone
    await sendOTP(phone, otp);

    res
      .status(200)
      .json({ success: true, message: "OTP sent successfully", OTP: otp });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const SignupLoginUser = async (req, res) => {
  try {
    const { phone, Gtoken } = req.body;

    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000);
    // // Send OTP via Phone
    //  await sendRegOTP(phone, otp);

    if (!Gtoken) {
      return res.status(400).json({
        success: false,
        message: "you can access this page ",
      });
    }

    // Validation
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Please fill all fields",
      });
    }

    const existingUser = await userModel.findOne({ phone });

    if (existingUser) {
      if (existingUser.password !== undefined) {
        if (existingUser.status === "0") {
          return res.status(400).json({
            success: false,
            message: "An error occurred. Please contact support.",
          });
        }
        return res.status(201).json({
          success: true,
          message: "User found with password",
          password: true,
        });
      } else {
        // Hash the OTP
        const ecryptOTP = await bcrypt.hash(String(otp), 10);

        if (existingUser.status === "0") {
          return res.status(400).json({
            success: false,
            message: "An error occurred. Please contact support.",
          });
        }

        // block
        console.log(otp);
        //  await sendLogOTP(phone, otp);

        return res.status(201).json({
          success: true,
          message: "User found",
          existingUser: {
            _id: existingUser._id,
            username: existingUser.username,
            phone: existingUser.phone,
            email: existingUser.email,
          },
          token: existingUser.token,
          otp: ecryptOTP,
        });
      }
    } else {
      const ecryptOTP = await bcrypt.hash(String(otp), 10);

      // block
      console.log(otp);
      // await sendRegOTP(phone, otp);
      return res.status(200).json({
        success: true,
        message: "New User found",
        newUser: true,
        otp: ecryptOTP,
      });
    }
  } catch (error) {
    console.error("Error on login:", error);
    return res.status(500).json({
      success: false,
      message: "Error on login",
      error: error.message,
    });
  }
};

export const SignupNewUser = async (req, res) => {
  try {
    const { phone } = req.body;

    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000);
    // // Send OTP via Phone
    // await sendOTP(phone, otp);

    // Validation
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Please fill all fields",
      });
    }

    // Create a new user
    const user = new userModel({ phone });
    const token = jwt.sign({ userId: user._id }, secretKey, {
      expiresIn: "1h",
    });
    user.token = token; // Update the user's token field with the generated token
    await user.save();

    // Hash the OTP
    const ecryptOTP = await bcrypt.hash(String(otp), 10);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      existingUser: {
        _id: user._id,
        username: user.username,
        phone: user.phone,
        email: user.email,
      },
      otp: ecryptOTP,
      token,
    });
  } catch (error) {
    console.error("Error on signup:", error);
    res.status(500).json({
      success: false,
      message: "Error on signup",
      error: error.message,
    });
  }
};

export const LoginUserWithOTP = async (req, res) => {
  try {
    const { phone, Gtoken } = req.body;

    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000);
    // // Send OTP via Phone
    // await sendLogOTP(phone, otp);

    // if (!Gtoken) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'you can access this page ',
    //   });
    // }
    // Validation
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Please fill all fields",
      });
    }

    const existingUser = await userModel.findOne({ phone, status: "1" });

    if (existingUser) {
      // Hash the OTP
      const ecryptOTP = await bcrypt.hash(String(otp), 10);

      // block
      console.log(otp);
      //   await sendLogOTP(phone, otp);

      return res.status(201).json({
        success: true,
        message: "User found",
        existingUser: {
          _id: existingUser._id,
          username: existingUser.username,
          phone: existingUser.phone,
          email: existingUser.email,
        },
        token: existingUser.token,
        otp: ecryptOTP,
      });
    }
  } catch (error) {
    console.error("Error on signup:", error);
    res.status(500).json({
      success: false,
      message: "Error on signup",
      error: error.message,
    });
  }
};

export const LoginUserWithPass = async (req, res) => {
  try {
    const { phone, Gtoken, password } = req.body;

    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000);

    if (!phone || !password || !Gtoken) {
      return res.status(400).send({
        success: false,
        message: "please fill all fields",
      });
    }
    const user = await userModel.findOne({ phone });

    // password check

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).send({
        success: false,
        message: "password is not incorrect",
        user,
      });
    }

    // const token = jwt.sign({ userId: user._id }, secretKey, { expiresIn: '1h' });

    return res.status(200).json({
      success: true,
      message: "login sucesssfully with password",
      existingUser: {
        _id: user._id,
        username: user.username,
        phone: user.phone,
        email: user.email,
      },
      token: user.token,
      checkpass: true,
    });
  } catch (error) {
    return res.status(500).send({
      message: `error on login ${error}`,
      sucesss: false,
      error,
    });
  }
};

export const LoginAndVerifyOTP = async (req, res) => {
  try {
    const { OTP, HASHOTP } = req.body;

    const isMatch = await bcrypt.compare(OTP, HASHOTP);

    if (isMatch) {
      return res.status(200).json({
        success: true,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "OTP Not Verified",
      });
    }
  } catch (error) {
    return res.status(500).send({
      message: `error on login ${error}`,
      sucesss: false,
      error,
    });
  }
};

export const updatePromoAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const { name, rate, type, status } = req.body;

    let updateFields = {
      name,
      rate,
      type,
      status,
    };

    const Promo = await promoModel.findByIdAndUpdate(id, updateFields, {
      new: true,
    });

    return res.status(200).json({
      message: "Promo code Updated!",
      success: true,
      Promo,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error while updating Promo code: ${error}`,
      success: false,
      error,
    });
  }
};

export const AuthUserByID = async (req, res) => {
  const id = req.body.id;
  console.log(id);
  try {
    const existingUser = await userModel.findById(id);

    if (existingUser) {
      // if (existingUser.token === token) {
      return res.status(200).json({
        success: true,
        message: "login sucesssfully with password",
        existingUser: {
          _id: existingUser._id,
          username: existingUser.username,
          phone: existingUser.phone,
          email: existingUser.email,
          type: existingUser.type,
          address: existingUser.address,
          pincode: existingUser.pincode,
          state: existingUser.state,
          statename: existingUser.statename,
          country: existingUser.country,
          city: existingUser.city,
          verified: existingUser.verified,
          experience: existingUser.experience || "",
          specialization: existingUser.specialization || "",
          MedicalRegistrationNumber:
            existingUser.MedicalRegistrationNumber || "",
          issuingMedicalCouncil: existingUser.issuingMedicalCouncil || "",
          highestMedicalDegree: existingUser.highestMedicalDegree || "",
          institutionUniversity: existingUser.institutionUniversity || "",
          yearOfGraduation: existingUser.yearOfGraduation || "",
          jobLocation: existingUser.jobLocation || "",
          employmentType: existingUser.employmentType || "",
          salaryExpectation: existingUser.salaryExpectation || "",
          linkedInProfile: existingUser.linkedInProfile || "",
          ProfessionalAchievements: existingUser.ProfessionalAchievements || "",
          profile_url: existingUser.profile_url || "",
          LicensingFile: existingUser.LicensingFile || "",
          CertificationsFile: existingUser.CertificationsFile || "",
          ExtraCertificationsFile: existingUser.ExtraCertificationsFile || "",
          AccreditationCertificateFile:
            existingUser.AccreditationCertificateFile || "",
          numberOfBeds: existingUser.numberOfBeds || "",
          Designation: existingUser.Designation || "",
          departmentsAvailable: existingUser.departmentsAvailable || "",
          interestedServices: existingUser.interestedServices || "",
          typeHospital: existingUser.typeHospital || "",
          website: existingUser.website || "",
          NatureOfBusiness: existingUser.NatureOfBusiness || "",
          TypeOfProducts: existingUser.TypeOfProducts || "",
          PersonApproved: existingUser.PersonApproved || "",
          OfferEquipment: existingUser.OfferEquipment || "",
          ServiceArea: existingUser.ServiceArea || "",
          ComplianceCertificateFile:
            existingUser.ComplianceCertificateFile || "",
          TaxDocumentsFile: existingUser.TaxDocumentsFile || "",
          about: existingUser.about || "",
        },
      });
      // } else {
      //   return res.status(401).send({
      //     success: false,
      //     message: "token is not incorrect",
      //   });
      // }
    } else {
      return res.status(401).send({
        success: false,
        message: "user Not found",
      });
    }
  } catch (error) {
    return res.status(500).send({
      message: `error on Auth ${error}`,
      sucesss: false,
      error,
    });
  }
};

export const CheckProfileUrl = async (req, res) => {
  const { email, password } = req.body;
  //validation
  if (!email || !password) {
    return res.status(400).send({
      success: false,
      message: "please fill all fields",
    });
  }
};

const cityData = {
  "Andaman and Nicobar Islands": ["Port Blair"],
  Haryana: [
    "Faridabad",
    "Gurgaon",
    "Hisar",
    "Rohtak",
    "Panipat",
    "Karnal",
    "Sonipat",
    "Yamunanagar",
    "Panchkula",
    "Bhiwani",
    "Bahadurgarh",
    "Jind",
    "Sirsa",
    "Thanesar",
    "Kaithal",
    "Palwal",
    "Rewari",
    "Hansi",
    "Narnaul",
    "Fatehabad",
    "Gohana",
    "Tohana",
    "Narwana",
    "Mandi Dabwali",
    "Charkhi Dadri",
    "Shahbad",
    "Pehowa",
    "Samalkha",
    "Pinjore",
    "Ladwa",
    "Sohna",
    "Safidon",
    "Taraori",
    "Mahendragarh",
    "Ratia",
    "Rania",
    "Sarsod",
  ],
  "Tamil Nadu": [
    "Chennai",
    "Coimbatore",
    "Madurai",
    "Tiruchirappalli",
    "Salem",
    "Tirunelveli",
    "Tiruppur",
    "Ranipet",
    "Nagercoil",
    "Thanjavur",
    "Vellore",
    "Kancheepuram",
    "Erode",
    "Tiruvannamalai",
    "Pollachi",
    "Rajapalayam",
    "Sivakasi",
    "Pudukkottai",
    "Neyveli (TS)",
    "Nagapattinam",
    "Viluppuram",
    "Tiruchengode",
    "Vaniyambadi",
    "Theni Allinagaram",
    "Udhagamandalam",
    "Aruppukkottai",
    "Paramakudi",
    "Arakkonam",
    "Virudhachalam",
    "Srivilliputhur",
    "Tindivanam",
    "Virudhunagar",
    "Karur",
    "Valparai",
    "Sankarankovil",
    "Tenkasi",
    "Palani",
    "Pattukkottai",
    "Tirupathur",
    "Ramanathapuram",
    "Udumalaipettai",
    "Gobichettipalayam",
    "Thiruvarur",
    "Thiruvallur",
    "Panruti",
    "Namakkal",
    "Thirumangalam",
    "Vikramasingapuram",
    "Nellikuppam",
    "Rasipuram",
    "Tiruttani",
    "Nandivaram-Guduvancheri",
    "Periyakulam",
    "Pernampattu",
    "Vellakoil",
    "Sivaganga",
    "Vadalur",
    "Rameshwaram",
    "Tiruvethipuram",
    "Perambalur",
    "Usilampatti",
    "Vedaranyam",
    "Sathyamangalam",
    "Puliyankudi",
    "Nanjikottai",
    "Thuraiyur",
    "Sirkali",
    "Tiruchendur",
    "Periyasemur",
    "Sattur",
    "Vandavasi",
    "Tharamangalam",
    "Tirukkoyilur",
    "Oddanchatram",
    "Palladam",
    "Vadakkuvalliyur",
    "Tirukalukundram",
    "Uthamapalayam",
    "Surandai",
    "Sankari",
    "Shenkottai",
    "Vadipatti",
    "Sholingur",
    "Tirupathur",
    "Manachanallur",
    "Viswanatham",
    "Polur",
    "Panagudi",
    "Uthiramerur",
    "Thiruthuraipoondi",
    "Pallapatti",
    "Ponneri",
    "Lalgudi",
    "Natham",
    "Unnamalaikadai",
    "P.N.Patti",
    "Tharangambadi",
    "Tittakudi",
    "Pacode",
    "O' Valley",
    "Suriyampalayam",
    "Sholavandan",
    "Thammampatti",
    "Namagiripettai",
    "Peravurani",
    "Parangipettai",
    "Pudupattinam",
    "Pallikonda",
    "Sivagiri",
    "Punjaipugalur",
    "Padmanabhapuram",
    "Thirupuvanam",
  ],
  "Madhya Pradesh": [
    "Indore",
    "Bhopal",
    "Jabalpur",
    "Gwalior",
    "Ujjain",
    "Sagar",
    "Ratlam",
    "Satna",
    "Murwara (Katni)",
    "Morena",
    "Singrauli",
    "Rewa",
    "Vidisha",
    "Ganjbasoda",
    "Shivpuri",
    "Mandsaur",
    "Neemuch",
    "Nagda",
    "Itarsi",
    "Sarni",
    "Sehore",
    "Mhow Cantonment",
    "Seoni",
    "Balaghat",
    "Ashok Nagar",
    "Tikamgarh",
    "Shahdol",
    "Pithampur",
    "Alirajpur",
    "Mandla",
    "Sheopur",
    "Shajapur",
    "Panna",
    "Raghogarh-Vijaypur",
    "Sendhwa",
    "Sidhi",
    "Pipariya",
    "Shujalpur",
    "Sironj",
    "Pandhurna",
    "Nowgong",
    "Mandideep",
    "Sihora",
    "Raisen",
    "Lahar",
    "Maihar",
    "Sanawad",
    "Sabalgarh",
    "Umaria",
    "Porsa",
    "Narsinghgarh",
    "Malaj Khand",
    "Sarangpur",
    "Mundi",
    "Nepanagar",
    "Pasan",
    "Mahidpur",
    "Seoni-Malwa",
    "Rehli",
    "Manawar",
    "Rahatgarh",
    "Panagar",
    "Wara Seoni",
    "Tarana",
    "Sausar",
    "Rajgarh",
    "Niwari",
    "Mauganj",
    "Manasa",
    "Nainpur",
    "Prithvipur",
    "Sohagpur",
    "Nowrozabad (Khodargama)",
    "Shamgarh",
    "Maharajpur",
    "Multai",
    "Pali",
    "Pachore",
    "Rau",
    "Mhowgaon",
    "Vijaypur",
    "Narsinghgarh",
  ],
  Jharkhand: [
    "Dhanbad",
    "Ranchi",
    "Jamshedpur",
    "Bokaro Steel City",
    "Deoghar",
    "Phusro",
    "Adityapur",
    "Hazaribag",
    "Giridih",
    "Ramgarh",
    "Jhumri Tilaiya",
    "Saunda",
    "Sahibganj",
    "Medininagar (Daltonganj)",
    "Chaibasa",
    "Chatra",
    "Gumia",
    "Dumka",
    "Madhupur",
    "Chirkunda",
    "Pakaur",
    "Simdega",
    "Musabani",
    "Mihijam",
    "Patratu",
    "Lohardaga",
    "Tenu dam-cum-Kathhara",
  ],
  Mizoram: ["Aizawl", "Lunglei", "Saiha"],
  Nagaland: [
    "Dimapur",
    "Kohima",
    "Zunheboto",
    "Tuensang",
    "Wokha",
    "Mokokchung",
  ],
  "Himachal Pradesh": [
    "Shimla",
    "Mandi",
    "Solan",
    "Nahan",
    "Sundarnagar",
    "Palampur",
    "Kullu",
  ],
  Tripura: [
    "Agartala",
    "Udaipur",
    "Dharmanagar",
    "Pratapgarh",
    "Kailasahar",
    "Belonia",
    "Khowai",
  ],
  "Andhra Pradesh": [
    "Visakhapatnam",
    "Vijayawada",
    "Guntur",
    "Nellore",
    "Kurnool",
    "Rajahmundry",
    "Kakinada",
    "Tirupati",
    "Anantapur",
    "Kadapa",
    "Vizianagaram",
    "Eluru",
    "Ongole",
    "Nandyal",
    "Machilipatnam",
    "Adoni",
    "Tenali",
    "Chittoor",
    "Hindupur",
    "Proddatur",
    "Bhimavaram",
    "Madanapalle",
    "Guntakal",
    "Dharmavaram",
    "Gudivada",
    "Srikakulam",
    "Narasaraopet",
    "Rajampet",
    "Tadpatri",
    "Tadepalligudem",
    "Chilakaluripet",
    "Yemmiganur",
    "Kadiri",
    "Chirala",
    "Anakapalle",
    "Kavali",
    "Palacole",
    "Sullurpeta",
    "Tanuku",
    "Rayachoti",
    "Srikalahasti",
    "Bapatla",
    "Naidupet",
    "Nagari",
    "Gudur",
    "Vinukonda",
    "Narasapuram",
    "Nuzvid",
    "Markapur",
    "Ponnur",
    "Kandukur",
    "Bobbili",
    "Rayadurg",
    "Samalkot",
    "Jaggaiahpet",
    "Tuni",
    "Amalapuram",
    "Bheemunipatnam",
    "Venkatagiri",
    "Sattenapalle",
    "Pithapuram",
    "Palasa Kasibugga",
    "Parvathipuram",
    "Macherla",
    "Gooty",
    "Salur",
    "Mandapeta",
    "Jammalamadugu",
    "Peddapuram",
    "Punganur",
    "Nidadavole",
    "Repalle",
    "Ramachandrapuram",
    "Kovvur",
    "Tiruvuru",
    "Uravakonda",
    "Narsipatnam",
    "Yerraguntla",
    "Pedana",
    "Puttur",
    "Renigunta",
    "Rajam",
    "Srisailam Project (Right Flank Colony) Township",
  ],
  Punjab: [
    "Ludhiana",
    "Patiala",
    "Amritsar",
    "Jalandhar",
    "Bathinda",
    "Pathankot",
    "Hoshiarpur",
    "Batala",
    "Moga",
    "Malerkotla",
    "Khanna",
    "Mohali",
    "Barnala",
    "Firozpur",
    "Phagwara",
    "Kapurthala",
    "Zirakpur",
    "Kot Kapura",
    "Faridkot",
    "Muktsar",
    "Rajpura",
    "Sangrur",
    "Fazilka",
    "Gurdaspur",
    "Kharar",
    "Gobindgarh",
    "Mansa",
    "Malout",
    "Nabha",
    "Tarn Taran",
    "Jagraon",
    "Sunam",
    "Dhuri",
    "Firozpur Cantt.",
    "Sirhind Fatehgarh Sahib",
    "Rupnagar",
    "Jalandhar Cantt.",
    "Samana",
    "Nawanshahr",
    "Rampura Phul",
    "Nangal",
    "Nakodar",
    "Zira",
    "Patti",
    "Raikot",
    "Longowal",
    "Urmar Tanda",
    "Morinda, India",
    "Phillaur",
    "Pattran",
    "Qadian",
    "Sujanpur",
    "Mukerian",
    "Talwara",
  ],
  Chandigarh: ["Chandigarh"],
  Rajasthan: [
    "Jaipur",
    "Jodhpur",
    "Bikaner",
    "Udaipur",
    "Ajmer",
    "Bhilwara",
    "Alwar",
    "Bharatpur",
    "Pali",
    "Barmer",
    "Sikar",
    "Tonk",
    "Sadulpur",
    "Sawai Madhopur",
    "Nagaur",
    "Makrana",
    "Sujangarh",
    "Sardarshahar",
    "Ladnu",
    "Ratangarh",
    "Nokha",
    "Nimbahera",
    "Suratgarh",
    "Rajsamand",
    "Lachhmangarh",
    "Rajgarh (Churu)",
    "Nasirabad",
    "Nohar",
    "Phalodi",
    "Nathdwara",
    "Pilani",
    "Merta City",
    "Sojat",
    "Neem-Ka-Thana",
    "Sirohi",
    "Pratapgarh",
    "Rawatbhata",
    "Sangaria",
    "Lalsot",
    "Pilibanga",
    "Pipar City",
    "Taranagar",
    "Vijainagar, Ajmer",
    "Sumerpur",
    "Sagwara",
    "Ramganj Mandi",
    "Lakheri",
    "Udaipurwati",
    "Losal",
    "Sri Madhopur",
    "Ramngarh",
    "Rawatsar",
    "Rajakhera",
    "Shahpura",
    "Shahpura",
    "Raisinghnagar",
    "Malpura",
    "Nadbai",
    "Sanchore",
    "Nagar",
    "Rajgarh (Alwar)",
    "Sheoganj",
    "Sadri",
    "Todaraisingh",
    "Todabhim",
    "Reengus",
    "Rajaldesar",
    "Sadulshahar",
    "Sambhar",
    "Prantij",
    "Mount Abu",
    "Mangrol",
    "Phulera",
    "Mandawa",
    "Pindwara",
    "Mandalgarh",
    "Takhatgarh",
  ],
  Assam: [
    "Guwahati",
    "Silchar",
    "Dibrugarh",
    "Nagaon",
    "Tinsukia",
    "Jorhat",
    "Bongaigaon City",
    "Dhubri",
    "Diphu",
    "North Lakhimpur",
    "Tezpur",
    "Karimganj",
    "Sibsagar",
    "Goalpara",
    "Barpeta",
    "Lanka",
    "Lumding",
    "Mankachar",
    "Nalbari",
    "Rangia",
    "Margherita",
    "Mangaldoi",
    "Silapathar",
    "Mariani",
    "Marigaon",
  ],
  Odisha: [
    "Bhubaneswar",
    "Cuttack",
    "Raurkela",
    "Brahmapur",
    "Sambalpur",
    "Puri",
    "Baleshwar Town",
    "Baripada Town",
    "Bhadrak",
    "Balangir",
    "Jharsuguda",
    "Bargarh",
    "Paradip",
    "Bhawanipatna",
    "Dhenkanal",
    "Barbil",
    "Kendujhar",
    "Sunabeda",
    "Rayagada",
    "Jatani",
    "Byasanagar",
    "Kendrapara",
    "Rajagangapur",
    "Parlakhemundi",
    "Talcher",
    "Sundargarh",
    "Phulabani",
    "Pattamundai",
    "Titlagarh",
    "Nabarangapur",
    "Soro",
    "Malkangiri",
    "Rairangpur",
    "Tarbha",
  ],
  Chhattisgarh: [
    "Raipur",
    "Bhilai Nagar",
    "Korba",
    "Bilaspur",
    "Durg",
    "Rajnandgaon",
    "Jagdalpur",
    "Raigarh",
    "Ambikapur",
    "Mahasamund",
    "Dhamtari",
    "Chirmiri",
    "Bhatapara",
    "Dalli-Rajhara",
    "Naila Janjgir",
    "Tilda Newra",
    "Mungeli",
    "Manendragarh",
    "Sakti",
  ],
  "Jammu and Kashmir": [
    "Srinagar",
    "Jammu",
    "Baramula",
    "Anantnag",
    "Sopore",
    "KathUrban Agglomeration",
    "Rajauri",
    "Punch",
    "Udhampur",
  ],
  Karnataka: [
    "Bengaluru",
    "Hubli-Dharwad",
    "Belagavi",
    "Mangaluru",
    "Davanagere",
    "Ballari",
    "Mysore",
    "Tumkur",
    "Shivamogga",
    "Raayachuru",
    "Robertson Pet",
    "Kolar",
    "Mandya",
    "Udupi",
    "Chikkamagaluru",
    "Karwar",
    "Ranebennuru",
    "Ranibennur",
    "Ramanagaram",
    "Gokak",
    "Yadgir",
    "Rabkavi Banhatti",
    "Shahabad",
    "Sirsi",
    "Sindhnur",
    "Tiptur",
    "Arsikere",
    "Nanjangud",
    "Sagara",
    "Sira",
    "Puttur",
    "Athni",
    "Mulbagal",
    "Surapura",
    "Siruguppa",
    "Mudhol",
    "Sidlaghatta",
    "Shahpur",
    "Saundatti-Yellamma",
    "Wadi",
    "Manvi",
    "Nelamangala",
    "Lakshmeshwar",
    "Ramdurg",
    "Nargund",
    "Tarikere",
    "Malavalli",
    "Savanur",
    "Lingsugur",
    "Vijayapura",
    "Sankeshwara",
    "Madikeri",
    "Talikota",
    "Sedam",
    "Shikaripur",
    "Mahalingapura",
    "Mudalagi",
    "Muddebihal",
    "Pavagada",
    "Malur",
    "Sindhagi",
    "Sanduru",
    "Afzalpur",
    "Maddur",
    "Madhugiri",
    "Tekkalakote",
    "Terdal",
    "Mudabidri",
    "Magadi",
    "Navalgund",
    "Shiggaon",
    "Shrirangapattana",
    "Sindagi",
    "Sakaleshapura",
    "Srinivaspur",
    "Ron",
    "Mundargi",
    "Sadalagi",
    "Piriyapatna",
    "Adyar",
  ],
  Manipur: ["Imphal", "Thoubal", "Lilong", "Mayang Imphal"],
  Kerala: [
    "Thiruvananthapuram",
    "Kochi",
    "Kozhikode",
    "Kollam",
    "Thrissur",
    "Palakkad",
    "Alappuzha",
    "Malappuram",
    "Ponnani",
    "Vatakara",
    "Kanhangad",
    "Taliparamba",
    "Koyilandy",
    "Neyyattinkara",
    "Kayamkulam",
    "Nedumangad",
    "Kannur",
    "Tirur",
    "Kottayam",
    "Kasaragod",
    "Kunnamkulam",
    "Ottappalam",
    "Thiruvalla",
    "Thodupuzha",
    "Chalakudy",
    "Changanassery",
    "Punalur",
    "Nilambur",
    "Cherthala",
    "Perinthalmanna",
    "Mattannur",
    "Shoranur",
    "Varkala",
    "Paravoor",
    "Pathanamthitta",
    "Peringathur",
    "Attingal",
    "Kodungallur",
    "Pappinisseri",
    "Chittur-Thathamangalam",
    "Muvattupuzha",
    "Adoor",
    "Mavelikkara",
    "Mavoor",
    "Perumbavoor",
    "Vaikom",
    "Palai",
    "Panniyannur",
    "Guruvayoor",
    "Puthuppally",
    "Panamattom",
  ],
  Delhi: ["Delhi", "New Delhi"],
  "Dadra and Nagar Haveli": ["Silvassa"],
  Puducherry: ["Pondicherry", "Karaikal", "Yanam", "Mahe"],
  Uttarakhand: [
    "Dehradun",
    "Hardwar",
    "Haldwani-cum-Kathgodam",
    "Srinagar",
    "Kashipur",
    "Roorkee",
    "Rudrapur",
    "Rishikesh",
    "Ramnagar",
    "Pithoragarh",
    "Manglaur",
    "Nainital",
    "Mussoorie",
    "Tehri",
    "Pauri",
    "Nagla",
    "Sitarganj",
    "Bageshwar",
  ],
  "Uttar Pradesh": [
    "Lucknow",
    "Kanpur",
    "Firozabad",
    "Agra",
    "Meerut",
    "Varanasi",
    "Allahabad",
    "Amroha",
    "Moradabad",
    "Aligarh",
    "Saharanpur",
    "Noida",
    "Loni",
    "Jhansi",
    "Shahjahanpur",
    "Rampur",
    "Modinagar",
    "Hapur",
    "Etawah",
    "Sambhal",
    "Orai",
    "Bahraich",
    "Unnao",
    "Rae Bareli",
    "Lakhimpur",
    "Sitapur",
    "Lalitpur",
    "Pilibhit",
    "Chandausi",
    "Hardoi ",
    "Azamgarh",
    "Khair",
    "Sultanpur",
    "Tanda",
    "Nagina",
    "Shamli",
    "Najibabad",
    "Shikohabad",
    "Sikandrabad",
    "Shahabad, Hardoi",
    "Pilkhuwa",
    "Renukoot",
    "Vrindavan",
    "Ujhani",
    "Laharpur",
    "Tilhar",
    "Sahaswan",
    "Rath",
    "Sherkot",
    "Kalpi",
    "Tundla",
    "Sandila",
    "Nanpara",
    "Sardhana",
    "Nehtaur",
    "Seohara",
    "Padrauna",
    "Mathura",
    "Thakurdwara",
    "Nawabganj",
    "Siana",
    "Noorpur",
    "Sikandra Rao",
    "Puranpur",
    "Rudauli",
    "Thana Bhawan",
    "Palia Kalan",
    "Zaidpur",
    "Nautanwa",
    "Zamania",
    "Shikarpur, Bulandshahr",
    "Naugawan Sadat",
    "Fatehpur Sikri",
    "Shahabad, Rampur",
    "Robertsganj",
    "Utraula",
    "Sadabad",
    "Rasra",
    "Lar",
    "Lal Gopalganj Nindaura",
    "Sirsaganj",
    "Pihani",
    "Shamsabad, Agra",
    "Rudrapur",
    "Soron",
    "SUrban Agglomerationr",
    "Samdhan",
    "Sahjanwa",
    "Rampur Maniharan",
    "Sumerpur",
    "Shahganj",
    "Tulsipur",
    "Tirwaganj",
    "PurqUrban Agglomerationzi",
    "Shamsabad, Farrukhabad",
    "Warhapur",
    "Powayan",
    "Sandi",
    "Achhnera",
    "Naraura",
    "Nakur",
    "Sahaspur",
    "Safipur",
    "Reoti",
    "Sikanderpur",
    "Saidpur",
    "Sirsi",
    "Purwa",
    "Parasi",
    "Lalganj",
    "Phulpur",
    "Shishgarh",
    "Sahawar",
    "Samthar",
    "Pukhrayan",
    "Obra",
    "Niwai",
    "Mirzapur",
  ],
  Bihar: [
    "Patna",
    "Gaya",
    "Bhagalpur",
    "Muzaffarpur",
    "Darbhanga",
    "Arrah",
    "Begusarai",
    "Chhapra",
    "Katihar",
    "Munger",
    "Purnia",
    "Saharsa",
    "Sasaram",
    "Hajipur",
    "Dehri-on-Sone",
    "Bettiah",
    "Motihari",
    "Bagaha",
    "Siwan",
    "Kishanganj",
    "Jamalpur",
    "Buxar",
    "Jehanabad",
    "Aurangabad",
    "Lakhisarai",
    "Nawada",
    "Jamui",
    "Sitamarhi",
    "Araria",
    "Gopalganj",
    "Madhubani",
    "Masaurhi",
    "Samastipur",
    "Mokameh",
    "Supaul",
    "Dumraon",
    "Arwal",
    "Forbesganj",
    "BhabUrban Agglomeration",
    "Narkatiaganj",
    "Naugachhia",
    "Madhepura",
    "Sheikhpura",
    "Sultanganj",
    "Raxaul Bazar",
    "Ramnagar",
    "Mahnar Bazar",
    "Warisaliganj",
    "Revelganj",
    "Rajgir",
    "Sonepur",
    "Sherghati",
    "Sugauli",
    "Makhdumpur",
    "Maner",
    "Rosera",
    "Nokha",
    "Piro",
    "Rafiganj",
    "Marhaura",
    "Mirganj",
    "Lalganj",
    "Murliganj",
    "Motipur",
    "Manihari",
    "Sheohar",
    "Maharajganj",
    "Silao",
    "Barh",
    "Asarganj",
  ],
  Gujarat: [
    "Ahmedabad",
    "Surat",
    "Vadodara",
    "Rajkot",
    "Bhavnagar",
    "Jamnagar",
    "Nadiad",
    "Porbandar",
    "Anand",
    "Morvi",
    "Mahesana",
    "Bharuch",
    "Vapi",
    "Navsari",
    "Veraval",
    "Bhuj",
    "Godhra",
    "Palanpur",
    "Valsad",
    "Patan",
    "Deesa",
    "Amreli",
    "Anjar",
    "Dhoraji",
    "Khambhat",
    "Mahuva",
    "Keshod",
    "Wadhwan",
    "Ankleshwar",
    "Savarkundla",
    "Kadi",
    "Visnagar",
    "Upleta",
    "Una",
    "Sidhpur",
    "Unjha",
    "Mangrol",
    "Viramgam",
    "Modasa",
    "Palitana",
    "Petlad",
    "Kapadvanj",
    "Sihor",
    "Wankaner",
    "Limbdi",
    "Mandvi",
    "Thangadh",
    "Vyara",
    "Padra",
    "Lunawada",
    "Rajpipla",
    "Vapi",
    "Umreth",
    "Sanand",
    "Rajula",
    "Radhanpur",
    "Mahemdabad",
    "Ranavav",
    "Tharad",
    "Mansa",
    "Umbergaon",
    "Talaja",
    "Vadnagar",
    "Manavadar",
    "Salaya",
    "Vijapur",
    "Pardi",
    "Rapar",
    "Songadh",
    "Lathi",
    "Adalaj",
    "Chhapra",
    "Gandhinagar",
  ],
  Telangana: [
    "Hyderabad",
    "Warangal",
    "Nizamabad",
    "Karimnagar",
    "Ramagundam",
    "Khammam",
    "Mahbubnagar",
    "Mancherial",
    "Adilabad",
    "Suryapet",
    "Jagtial",
    "Miryalaguda",
    "Nirmal",
    "Kamareddy",
    "Kothagudem",
    "Bodhan",
    "Palwancha",
    "Mandamarri",
    "Koratla",
    "Sircilla",
    "Tandur",
    "Siddipet",
    "Wanaparthy",
    "Kagaznagar",
    "Gadwal",
    "Sangareddy",
    "Bellampalle",
    "Bhongir",
    "Vikarabad",
    "Jangaon",
    "Bhadrachalam",
    "Bhainsa",
    "Farooqnagar",
    "Medak",
    "Narayanpet",
    "Sadasivpet",
    "Yellandu",
    "Manuguru",
    "Kyathampalle",
    "Nagarkurnool",
  ],
  Meghalaya: ["Shillong", "Tura", "Nongstoin"],
  "Himachal Praddesh": ["Manali"],
  "Arunachal Pradesh": ["Naharlagun", "Pasighat"],
  Maharashtra: [
    "Mumbai",
    "Pune",
    "Nagpur",
    "Thane",
    "Nashik",
    "Kalyan-Dombivali",
    "Vasai-Virar",
    "Solapur",
    "Mira-Bhayandar",
    "Bhiwandi",
    "Amravati",
    "Nanded-Waghala",
    "Sangli",
    "Malegaon",
    "Akola",
    "Latur",
    "Dhule",
    "Ahmednagar",
    "Ichalkaranji",
    "Parbhani",
    "Panvel",
    "Yavatmal",
    "Achalpur",
    "Osmanabad",
    "Nandurbar",
    "Satara",
    "Wardha",
    "Udgir",
    "Aurangabad",
    "Amalner",
    "Akot",
    "Pandharpur",
    "Shrirampur",
    "Parli",
    "Washim",
    "Ambejogai",
    "Manmad",
    "Ratnagiri",
    "Uran Islampur",
    "Pusad",
    "Sangamner",
    "Shirpur-Warwade",
    "Malkapur",
    "Wani",
    "Lonavla",
    "Talegaon Dabhade",
    "Anjangaon",
    "Umred",
    "Palghar",
    "Shegaon",
    "Ozar",
    "Phaltan",
    "Yevla",
    "Shahade",
    "Vita",
    "Umarkhed",
    "Warora",
    "Pachora",
    "Tumsar",
    "Manjlegaon",
    "Sillod",
    "Arvi",
    "Nandura",
    "Vaijapur",
    "Wadgaon Road",
    "Sailu",
    "Murtijapur",
    "Tasgaon",
    "Mehkar",
    "Yawal",
    "Pulgaon",
    "Nilanga",
    "Wai",
    "Umarga",
    "Paithan",
    "Rahuri",
    "Nawapur",
    "Tuljapur",
    "Morshi",
    "Purna",
    "Satana",
    "Pathri",
    "Sinnar",
    "Uchgaon",
    "Uran",
    "Pen",
    "Karjat",
    "Manwath",
    "Partur",
    "Sangole",
    "Mangrulpir",
    "Risod",
    "Shirur",
    "Savner",
    "Sasvad",
    "Pandharkaoda",
    "Talode",
    "Shrigonda",
    "Shirdi",
    "Raver",
    "Mukhed",
    "Rajura",
    "Vadgaon Kasba",
    "Tirora",
    "Mahad",
    "Lonar",
    "Sawantwadi",
    "Pathardi",
    "Pauni",
    "Ramtek",
    "Mul",
    "Soyagaon",
    "Mangalvedhe",
    "Narkhed",
    "Shendurjana",
    "Patur",
    "Mhaswad",
    "Loha",
    "Nandgaon",
    "Warud",
  ],
  Goa: ["Marmagao", "Panaji", "Margao", "Mapusa"],
  "West Bengal": [
    "Kolkata",
    "Siliguri",
    "Asansol",
    "Raghunathganj",
    "Kharagpur",
    "Naihati",
    "English Bazar",
    "Baharampur",
    "Hugli-Chinsurah",
    "Raiganj",
    "Jalpaiguri",
    "Santipur",
    "Balurghat",
    "Medinipur",
    "Habra",
    "Ranaghat",
    "Bankura",
    "Nabadwip",
    "Darjiling",
    "Purulia",
    "Arambagh",
    "Tamluk",
    "AlipurdUrban Agglomerationr",
    "Suri",
    "Jhargram",
    "Gangarampur",
    "Rampurhat",
    "Kalimpong",
    "Sainthia",
    "Taki",
    "Murshidabad",
    "Memari",
    "Paschim Punropara",
    "Tarakeswar",
    "Sonamukhi",
    "PandUrban Agglomeration",
    "Mainaguri",
    "Malda",
    "Panchla",
    "Raghunathpur",
    "Mathabhanga",
    "Monoharpur",
    "Srirampore",
    "Adra",
  ],
};

export const uploadDataZone = async (req, res) => {
  try {
    for (const [zoneName, cities] of Object.entries(cityData)) {
      // Create a new document for each zone
      const newZone = new zonesModel({
        name: zoneName,
        cities: cities, // Cities is directly assigned as an array
        status: "true", // Status can be set to any value you want
      });

      // Save the document to MongoDB
      await newZone.save();
    }

    console.log("Data uploaded successfully!");
  } catch (error) {
    console.error("Error uploading data:", error);
  }
};

export const getAllDoctors = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Current page, default is 1
    const limit = parseInt(req.query.limit) || 10; // Number of documents per page, default is 10
    const searchTerm = req.query.location || ""; // Get search term from the query parameters
    const specialty = req.query.specialty || ""; // Get search term from the query parameters
    const gender = req.query.gender || ""; // Get search term from the query parameters
    const experience = req.query.experience || ""; // Get search term from the query parameters
    const shortby = req.query.shortby || ""; // Get search term from the query parameters

    // Get startDate and endDate from query parameters
    const startDate = req.query.startDate
      ? new Date(req.query.startDate)
      : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

    // console.log(startDate, endDate)
    const skip = (page - 1) * limit;

    const query = {};
    if (searchTerm) {
      const regex = new RegExp(searchTerm, "i"); // Case-insensitive regex pattern for the search term

      // Add regex pattern to search both username and email fields for the full name
      query.$or = [
        { statename: regex },
        { address: regex },
        // { phone: regex }, // Add phone number search if needed
      ];
    }

    if (gender.length > 0) {
      query.gender = { $in: gender }; // Use $in operator to match any of the values in the array
    }
    if (experience.length > 0) {
      query.experience = { $in: experience }; // Use $in operator to match any of the values in the array
    }

    query.type = { $in: 2 }; // Use $in operator to match any of the values in the array
    query.verified = { $in: 1 }; // Use $in operator to match any of the values in the array

    // Add date range filtering to the query
    if (startDate && endDate) {
      query.createdAt = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.createdAt = { $gte: startDate };
    } else if (endDate) {
      query.createdAt = { $lte: endDate };
    }

    const totalUser = await userModel.countDocuments(query); // Count total documents matching the query

    const users = await userModel
      .find(query)
      .sort({ _id: -1 }) // Sort by _id in descending order
      .skip(skip)
      .limit(limit)
      .lean(); // Convert documents to plain JavaScript objects

    if (!users || users.length === 0) {
      // Check if no users found
      return res.status(401).send({
        // Send 404 Not Found response
        message: "No users found",
        success: false,
      });
    }

    return res.status(200).send({
      // Send successful response
      message: "All user list",
      userCount: users.length,
      currentPage: page,
      totalPages: Math.ceil(totalUser / limit),
      success: true,
      users: users, // Return users array
    });
  } catch (error) {
    return res.status(500).send({
      // Send 500 Internal Server Error response
      message: `Error while getting users: ${error.message}`,
      success: false,
      error,
    });
  }
};

export const getAllHospital = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Current page, default is 1
    const limit = parseInt(req.query.limit) || 10; // Number of documents per page, default is 10
    const searchTerm = req.query.location || ""; // Get search term from the query parameters
    const departmentsAvailable = req.query.departmentsAvailable || ""; // Get search term from the query parameters
    const typeHospital = req.query.typeHospital || ""; // Get search term from the query parameters
    const numberOfBeds = req.query.numberOfBeds || ""; // Get search term from the query parameters
    const shortby = req.query.shortby || ""; // Get search term from the query parameters

    // Get startDate and endDate from query parameters
    const startDate = req.query.startDate
      ? new Date(req.query.startDate)
      : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

    // console.log(startDate, endDate)
    const skip = (page - 1) * limit;

    const query = {};
    if (searchTerm) {
      const regex = new RegExp(searchTerm, "i"); // Case-insensitive regex pattern for the search term

      // Add regex pattern to search both username and email fields for the full name
      query.$or = [{ statename: regex }, { address: regex }];
    }

    if (departmentsAvailable) {
      const regex = new RegExp(departmentsAvailable, "i"); // Case-insensitive regex pattern for the search term

      // Add regex pattern to search both username and email fields for the full name
      query.$or = [
        { departmentsAvailable: regex },
        // { address: regex },
        // { phone: regex }, // Add phone number search if needed
      ];
    }

    if (typeHospital.length > 0) {
      query.typeHospital = { $in: typeHospital }; // Use $in operator to match any of the values in the array
    }
    if (numberOfBeds.length > 0) {
      query.numberOfBeds = { $in: numberOfBeds }; // Use $in operator to match any of the values in the array
    }

    query.type = { $in: 3 }; // Use $in operator to match any of the values in the array
    query.verified = { $in: 1 }; // Use $in operator to match any of the values in the array

    // Add date range filtering to the query
    if (startDate && endDate) {
      query.createdAt = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.createdAt = { $gte: startDate };
    } else if (endDate) {
      query.createdAt = { $lte: endDate };
    }

    const totalUser = await userModel.countDocuments(query); // Count total documents matching the query

    const users = await userModel
      .find(query)
      .sort({ _id: -1 }) // Sort by _id in descending order
      .skip(skip)
      .limit(limit)
      .lean(); // Convert documents to plain JavaScript objects

    if (!users || users.length === 0) {
      // Check if no users found
      return res.status(401).send({
        // Send 404 Not Found response
        message: "No users found",
        success: false,
      });
    }

    return res.status(200).send({
      // Send successful response
      message: "All user list",
      userCount: users.length,
      currentPage: page,
      totalPages: Math.ceil(totalUser / limit),
      success: true,
      users: users, // Return users array
    });
  } catch (error) {
    return res.status(500).send({
      // Send 500 Internal Server Error response
      message: `Error while getting users: ${error.message}`,
      success: false,
      error,
    });
  }
};

export const updateProfileUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, phone, state, email, pincode, address, password } =
      req.body;

    if (!password) {
      if (!username || !email || !pincode || !address || !state) {
        return res.status(400).json({
          success: false,
          message: "Please fill all fields",
        });
      }

      let updateFields = {
        username,
        email,
        pincode,
        address,
        state,
      };

      await userModel.findByIdAndUpdate(id, updateFields, {
        new: true,
      });

      return res.status(200).json({
        message: "Profile Updated!",
        success: true,
      });
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);

      let updateFields = {
        password: hashedPassword,
      };

      const user = await userModel.findByIdAndUpdate(id, updateFields, {
        new: true,
      });

      return res.status(200).json({
        message: "Password Updated!",
        success: true,
      });
    }
  } catch (error) {
    return res.status(400).json({
      message: `Error while updating Promo code: ${error}`,
      success: false,
      error,
    });
  }
};

export const contactEnquire = async (req, res) => {
  const { name, email, message } = req.body;

  // Configure nodemailer transporter
  const transporter = nodemailer.createTransport({
    // SMTP configuration
    host: process.env.MAIL_HOST, // Update with your SMTP host
    port: process.env.MAIL_PORT, // Update with your SMTP port
    secure: process.env.MAIL_ENCRYPTION, // Set to true if using SSL/TLS
    auth: {
      user: process.env.MAIL_USERNAME, // Update with your email address
      pass: process.env.MAIL_PASSWORD, // Update with your email password
    },
  });

  // Email message
  const mailOptions = {
    from: process.env.MAIL_FROM_ADDRESS, // Update with your email address
    to: process.env.MAIL_TO_ADDRESS, // Update with your email address
    subject: "New Contact Us Form Submission",
    text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
  };

  // Send email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
      res.status(500).send("Failed to send email");
    } else {
      console.log("Email sent: " + info.response);
      res.status(200).send("Email sent successfully");
    }
  });
};

export const getUserByprofile_url = async (req, res) => {
  try {
    const { slug } = req.params;
    const Mpage = await userModel.findOne({ profile_url: slug });
    if (!Mpage) {
      return res.status(200).send({
        message: "user not found",
        success: false,
      });
    }
    return res.status(200).json({
      message: "fetch user Page!",
      success: true,
      Mpage,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error while get Page: ${error}`,
      success: false,
      error,
    });
  }
};

export const getProductsByHSN = async (req, res) => {
  try {
    const { id } = req.params;

    const products = await productModel
      .find({ hsn: id })
      .select("variations")
      .exec();
    if (!products) {
      return res.status(401).send({
        success: false,
        message: "Product not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Product found",
      products,
    });
  } catch (error) {
    return res.status(500).send({
      message: `error on Auth ${error}`,
      sucesss: false,
      error,
    });
  }
};

export const getProductsByFilterUser = async (req, res) => {
  try {
    const { title, value, hsn } = req.query; // Destructure title, value, and hsn

    // Construct the filter object
    const filter = {};
    if (title && value) {
      filter[`variations.${title}.0.${title}`] = value;
    }
    if (hsn) {
      filter.hsn = hsn;
    }

    // Find products based on the filter
    const products = await productModel.find(filter);

    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// for cancel order

export const cancelOrderUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, reason } = req.body;

    let updateFields = {
      status: "0",
      comment,
      reason,
    };

    await orderModel.findByIdAndUpdate(id, updateFields, {
      new: true,
    });

    return res.status(200).json({
      message: "Order Cancel!",
      success: true,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error while updating Rating: ${error}`,
      success: false,
      error,
    });
  }
};

export const getJobByIDAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const Job = await jobModel.findById(id);
    if (!Job) {
      return res.status(200).send({
        message: "Job Not Found By Id",
        success: false,
      });
    }
    return res.status(200).json({
      message: "fetch Single Job!",
      success: true,
      Job,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error while get Job: ${error}`,
      success: false,
      error,
    });
  }
};
