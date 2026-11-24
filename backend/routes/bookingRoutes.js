
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const Booking = require("../models/Booking");
const Hotel = require("../models/Hotel");

const router = express.Router();

// CREATE UPLOAD DIRECTORY
const uploadDirectory = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

// FILE UPLOAD SETTINGS
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname).toLowerCase();

    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf"
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, JPG, PNG and WEBP files are allowed."));
    }
  }
});

// DATE VALIDATION
function validDates(checkIn, checkOut) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return false;
  }

  return end > start;
}

// GET ROOM AVAILABILITY
router.get("/availability", async (req, res) => {
  try {
    const { hotelId, checkIn, checkOut } = req.query;

    if (
      !hotelId ||
      !mongoose.Types.ObjectId.isValid(hotelId) ||
      !validDates(checkIn, checkOut)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid hotel and booking dates."
      });
    }

    const hotel = await Hotel.findById(hotelId);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found."
      });
    }

    const totalRooms = hotel.totalRooms || 30;

    // A booking overlaps if:
    // existing check-in < requested check-out
    // AND existing check-out > requested check-in
    const bookings = await Booking.find({
      hotelId,
      status: { $ne: "Cancelled" },
      checkIn: { $lt: new Date(checkOut) },
      checkOut: { $gt: new Date(checkIn) }
    }).select("roomNumbers");

    const bookedRooms = [
      ...new Set(bookings.flatMap(item => item.roomNumbers))
    ];

    const rooms = Array.from(
      { length: totalRooms },
      (_, index) => ({
        roomNumber: index + 1,
        status: bookedRooms.includes(index + 1)
          ? "Booked"
          : "Available"
      })
    );

    res.json({
      success: true,
      totalRooms,
      bookedRooms,
      rooms
    });

  } catch (error) {
    console.error("Availability Error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to check room availability."
    });
  }
});

// CREATE BOOKING
router.post("/", (req, res, next) => {
  upload.single("identityProof")(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    next();
  });
}, async (req, res) => {
  try {
    const {
      hotelId,
      guestName,
      email,
      phone,
      address,
      paymentMode,
      paymentReference,
      roomType,
      roomNumbers,
      checkIn,
      checkOut,
      guests
    } = req.body;

    if (
      !hotelId ||
      !guestName ||
      !email ||
      !phone ||
      !address ||
      !paymentMode ||
      !roomType ||
      !roomNumbers ||
      !checkIn ||
      !checkOut ||
      !guests ||
      !req.file
    ) {
      return res.status(400).json({
        success: false,
        message: "Please complete all required fields and upload identity proof."
      });
    }

    if (!mongoose.Types.ObjectId.isValid(hotelId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hotel ID."
      });
    }

    if (!validDates(checkIn, checkOut)) {
      return res.status(400).json({
        success: false,
        message: "Invalid check-in or check-out dates."
      });
    }

    const start = new Date(checkIn);
    const end = new Date(checkOut);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      return res.status(400).json({
        success: false,
        message: "Check-in date cannot be in the past."
      });
    }

    const selectedRooms = [
      ...new Set(
        (Array.isArray(roomNumbers) ? roomNumbers : [roomNumbers])
          .map(Number)
      )
    ];

    if (
      selectedRooms.some(
        room => !Number.isInteger(room) || room < 1 || room > 30
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid room selection."
      });
    }

    const guestCount = Number(guests);

    if (!Number.isInteger(guestCount) || guestCount < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid guest count."
      });
    }

    const hotel = await Hotel.findById(hotelId);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found."
      });
    }

    const totalRooms = hotel.totalRooms || 30;

    if (selectedRooms.some(room => room > totalRooms)) {
      return res.status(400).json({
        success: false,
        message: "Selected room does not exist."
      });
    }

    // Recheck availability immediately before saving
    const conflictingBooking = await Booking.findOne({
      hotelId,
      roomNumbers: { $in: selectedRooms },
      status: { $ne: "Cancelled" },
      checkIn: { $lt: end },
      checkOut: { $gt: start }
    });

    if (conflictingBooking) {
      return res.status(409).json({
        success: false,
        message: "One or more selected rooms are no longer available. Please select again."
      });
    }

    const millisecondsPerDay = 24 * 60 * 60 * 1000;

    const nights = Math.round(
      (end - start) / millisecondsPerDay
    );

    const pricePerNight = Number(hotel.price);
    const estimatedTotal =
      nights * selectedRooms.length * pricePerNight;

    const booking = await Booking.create({
      hotelId: hotel._id,
      hotelName: hotel.name,
      guestName,
      email,
      phone,
      address,
      paymentMode,
      paymentReference: paymentReference || "",
      identityProof: `/uploads/${req.file.filename}`,
      roomNumbers: selectedRooms,
      roomType,
      checkIn: start,
      checkOut: end,
      guests: guestCount,
      pricePerNight,
      nights,
      totalRooms: selectedRooms.length,
      estimatedTotal,
      status: "Pending"
    });

    res.status(201).json({
      success: true,
      message: "Booking request submitted successfully!",
      booking
    });

  } catch (error) {
    console.error("Booking Error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to create booking.",
      error: error.message
    });
  }
});

// GET ALL BOOKINGS
router.get("/", async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("hotelId")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      bookings
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to fetch bookings."
    });
  }
});

// GET SINGLE BOOKING
router.get("/:id", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found."
      });
    }

    res.json({
      success: true,
      booking
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Unable to fetch booking."
    });
  }
});

module.exports = router;
