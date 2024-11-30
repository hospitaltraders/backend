import mongoose from "mongoose";

const orderSchema = mongoose.Schema({
  items: {
    type: Array,
    required: [true, "items is required"],
  },
  status: {
    type: String,
  },
  mode: {
    type: String,
  },
  details: {
    type: Array,
  },
  discount: {
    type: String,
  },
  shipping: {
    type: String,
  },
  totalAmount: {
    required: [true, "Total Amount is required"],
    type: Number,
  },
  userId: [{  // Changed field name to plural and set type as an array of ObjectIds
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  primary: {
    type: String,
  }, payment: {
    type: Number,
    default: 0,
  },
  orderId: {
    type: Number,
  },
  reason: {
    type: String,
  },
  comment: {
    type: String,
  },
},
  { timestamps: true }
);

const orderModel = mongoose.model('Order', orderSchema);

export default orderModel;