const mongoose = require("mongoose");

const hotelSchema = new mongoose.Schema(
    {
    name: {
        type: String,
        required: true,
        trim: true
    },

    location: {
        type: String,
        required: true
    },

    address: {
        type: String,
        default: "Nandyal, Andhra Pradesh, India"
    },

    hotelType: {
        type: String,
        default: "Business Hotel"
    },

    description: {
        type: String,
        required: true
    },

    tagline: {
        type: String,
        default: "Your Comfort, Our Priority"
    },

    phone: {
        type: String,
        default: ""
    },

    email: {
        type: String,
        default: ""
    },

    price: {
        type: Number,
        required: true
    },

    rating: {
        type: Number,
        default: 0
    },

    image: {
        type: String,
        required: true
    },

    availableRooms: {
        type: Number,
        default: 0
    },

    totalRooms: {
    type: Number,
    default: 30
    },

    amenities: {
        type: [String],
        default: []
    },

    businessFacilities: {
        type: [String],
        default: []
    },

    checkIn: {
        type: String,
        default: "12:00 PM"
    },

    checkOut: {
        type: String,
        default: "11:00 AM"
    }
},
{
    timestamps: true
}
);

const Hotel = mongoose.model("Hotel", hotelSchema);

module.exports = Hotel;
