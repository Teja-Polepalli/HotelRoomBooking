const express = require("express");
const router = express.Router();

const Hotel = require("../models/Hotel");

// GET - Get all hotels
router.get("/", async (req, res) => {
    try {
    const hotels = await Hotel.find();

    res.status(200).json({
        success: true,
        count: hotels.length,
        hotels: hotels
    });
} catch (error) {
    res.status(500).json({
        success: false,
        message: error.message
    });
}
});

// GET - Get single hotel by ID
router.get("/:id", async (req, res) => {
    try {
    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
        return res.status(404).json({
        success: false,
        message: "Hotel not found"
    });
    }

    res.status(200).json({
        success: true,
        hotel: hotel
    });
} catch (error) {
    res.status(400).json({
        success: false,
        message: error.message
    });
}
});

// POST - Add a new hotel
router.post("/", async (req, res) => {
    try {
    const newHotel = new Hotel(req.body);
    const savedHotel = await newHotel.save();

    res.status(201).json({
        success: true,
        message: "Hotel added successfully",
        hotel: savedHotel
    });
} catch (error) {
    res.status(400).json({
        success: false,
        message: error.message
    });
}
});

module.exports = router;
