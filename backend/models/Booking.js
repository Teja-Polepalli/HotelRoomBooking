
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true
    },

    hotelName: {
      type: String,
      required: true
    },

    guestName: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },

    phone: {
      type: String,
      required: true,
      trim: true
    },

    address: {
      type: String,
      required: true
    },

    paymentMode: {
      type: String,
      enum: ["Cash at Hotel", "UPI", "Bank Transfer", "Card at Hotel"],
      required: true
    },

    paymentReference: {
      type: String,
      default: ""
    },

    identityProof: {
      type: String,
      required: true
    },

    roomNumbers: {
      type: [Number],
      required: true,
      validate: {
        validator: value => value.length > 0,
        message: "Select at least one room."
      }
    },

    roomType: {
      type: String,
      required: true
    },

    checkIn: {
      type: Date,
      required: true
    },

    checkOut: {
      type: Date,
      required: true
    },

    guests: {
      type: Number,
      required: true,
      min: 1
    },

    pricePerNight: {
      type: Number,
      required: true
    },

    nights: {
      type: Number,
      required: true
    },

    totalRooms: {
      type: Number,
      required: true
    },

    estimatedTotal: {
      type: Number,
      required: true
    },

    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Cancelled"],
      default: "Pending"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Booking", bookingSchema);
