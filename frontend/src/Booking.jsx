
import { useState } from "react";
import API from "./services/api";

function Booking({ hotel }) {
  const [step, setStep] = useState(1);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [rooms, setRooms] = useState([]);
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [bookingResult, setBookingResult] = useState(null);

  const [guest, setGuest] = useState({
    guestName: "",
    email: "",
    phone: "",
    address: "",
    roomType: "Deluxe Room",
    guests: 2,
    paymentMode: "Cash at Hotel",
    paymentReference: ""
  });

  const [identityProof, setIdentityProof] = useState(null);

  const today = new Date().toLocaleDateString("en-CA");

  const nights =
    checkIn && checkOut
      ? Math.max(
          0,
          Math.round(
            (new Date(checkOut + "T00:00:00") -
              new Date(checkIn + "T00:00:00")) /
              86400000
          )
        )
      : 0;

  const totalPrice =
    hotel.price * nights * selectedRooms.length;

  const handleGuestChange = (e) => {
    setGuest({
      ...guest,
      [e.target.name]: e.target.value
    });
  };

  // STEP 1: FETCH AVAILABLE ROOMS
  const handleDateSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!checkIn || !checkOut || nights < 1) {
      setMessage("Please select valid check-in and check-out dates.");
      return;
    }

    if (checkIn < today) {
      setMessage("Check-in date cannot be in the past.");
      return;
    }

    try {
      setLoadingRooms(true);

      const response = await API.get("/bookings/availability", {
        params: {
          hotelId: hotel._id,
          checkIn,
          checkOut
        }
      });

      setRooms(response.data.rooms);
      setSelectedRooms([]);
      setStep(2);

    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        "Unable to check room availability."
      );
    } finally {
      setLoadingRooms(false);
    }
  };

  // STEP 2: SELECT / DESELECT ROOMS
  const toggleRoom = (roomNumber) => {
    const room = rooms.find(
      item => item.roomNumber === roomNumber
    );

    if (!room || room.status === "Booked") {
      return;
    }

    setSelectedRooms(prev =>
      prev.includes(roomNumber)
        ? prev.filter(number => number !== roomNumber)
        : [...prev, roomNumber].sort((a, b) => a - b)
    );
  };

  // STEP 3: SUBMIT BOOKING
  const handleBooking = async (e) => {
    e.preventDefault();
    setMessage("");

    if (selectedRooms.length === 0) {
      setMessage("Please select at least one room.");
      setStep(2);
      return;
    }

    if (!/^[0-9]{10}$/.test(guest.phone)) {
      setMessage("Please enter a valid 10-digit phone number.");
      return;
    }

    if (!identityProof) {
      setMessage("Please upload your identity proof.");
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!allowedTypes.includes(identityProof.type)) {
      setMessage("Only PDF, JPG, PNG and WEBP files are allowed.");
      return;
    }

    if (identityProof.size > 5 * 1024 * 1024) {
      setMessage("Identity proof must be smaller than 5 MB.");
      return;
    }

    const formData = new FormData();

    formData.append("hotelId", hotel._id);
    formData.append("guestName", guest.guestName);
    formData.append("email", guest.email);
    formData.append("phone", guest.phone);
    formData.append("address", guest.address);
    formData.append("roomType", guest.roomType);
    formData.append("guests", guest.guests);
    formData.append("paymentMode", guest.paymentMode);
    formData.append("paymentReference", guest.paymentReference);
    formData.append("checkIn", checkIn);
    formData.append("checkOut", checkOut);
    formData.append("identityProof", identityProof);

    selectedRooms.forEach(roomNumber => {
      formData.append("roomNumbers", roomNumber);
    });

    try {
      setSubmitting(true);

      const response = await API.post(
        "/bookings",
        formData
      );

      setBookingResult(response.data.booking);
      setMessage(response.data.message);
      setStep(4);

    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        "Booking failed. Please try again."
      );

      if (error.response?.status === 409) {
        setSelectedRooms([]);
        setStep(2);
        setRooms([]);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="booking-section section-padding" id="booking">

      <div className="section-heading">
        <span className="section-label">PLAN YOUR VISIT</span>
        <h2>Reserve Your Stay</h2>
        <p>
          Choose your dates, select your rooms and complete
          your guest details.
        </p>
      </div>

      {/* PROGRESS STEPS */}
      <div className="booking-steps">
        <div className={step >= 1 ? "step active" : "step"}>
          <span>1</span>
          <small>Select Date</small>
        </div>

        <div className="step-line"></div>

        <div className={step >= 2 ? "step active" : "step"}>
          <span>2</span>
          <small>Choose Rooms</small>
        </div>

        <div className="step-line"></div>

        <div className={step >= 3 ? "step active" : "step"}>
          <span>3</span>
          <small>Guest Details</small>
        </div>
      </div>

      <div className="multi-booking-card">

        {/* STEP 1: DATE SELECTION */}
        {step === 1 && (
          <div className="booking-step-content">
            <div className="booking-step-heading">
              <span className="section-label">STEP 01</span>
              <h3>Select Date</h3>
              <p>When are you visiting us?</p>
            </div>

            <form onSubmit={handleDateSubmit}>
              <div className="date-selection-grid">

                <div className="form-group">
                  <label>Check-in Date *</label>
                  <input
                    type="date"
                    value={checkIn}
                    min={today}
                    onChange={e => {
                      setCheckIn(e.target.value);
                      setCheckOut("");
                    }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Check-out Date *</label>
                  <input
                    type="date"
                    value={checkOut}
                    min={checkIn || today}
                    onChange={e => setCheckOut(e.target.value)}
                    required
                  />
                </div>

              </div>

              <div className="date-info">
                <span>Check-in: {hotel.checkIn}</span>
                <span>Check-out: {hotel.checkOut}</span>
                <span>Duration: {nights} night(s)</span>
              </div>

              {message && (
                <p className="booking-message">{message}</p>
              )}

              <div className="booking-action-row">
                <button
                  type="submit"
                  className="booking-next-btn"
                  disabled={loadingRooms}
                >
                  {loadingRooms ? "Checking Rooms..." : "Next Step →"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 2: ROOM SELECTION */}
        {step === 2 && (
          <div className="booking-step-content">
            <div className="booking-step-heading">
              <span className="section-label">STEP 02</span>
              <h3>Choose Your Rooms</h3>
              <p>
                Select one or more available rooms for your stay.
              </p>
            </div>

            <div className="selected-dates">
              <span>Check-in: <strong>{checkIn}</strong></span>
              <span>Check-out: <strong>{checkOut}</strong></span>
              <span><strong>{nights}</strong> night(s)</span>
            </div>

            <div className="room-legend">
              <span><i className="legend-available"></i> Available</span>
              <span><i className="legend-selected"></i> Selected</span>
              <span><i className="legend-booked"></i> Booked</span>
            </div>

            <div className="room-selection-grid">
              {rooms.map(room => {
                const selected = selectedRooms.includes(
                  room.roomNumber
                );

                return (
                  <button
                    type="button"
                    key={room.roomNumber}
                    disabled={room.status === "Booked"}
                    onClick={() => toggleRoom(room.roomNumber)}
                    className={[
                      "room-number",
                      room.status === "Booked" ? "booked" : "",
                      selected ? "selected" : ""
                    ].join(" ")}
                    aria-label={`Room ${room.roomNumber}, ${selected ? "selected" : room.status}`}
                    aria-pressed={selected}
                  >
                    {room.roomNumber}
                    {room.status === "Booked" && (
                      <small>Booked</small>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="room-summary">
              <div>
                <strong>{selectedRooms.length} Room(s) Selected</strong>
                <p>
                  {selectedRooms.length
                    ? selectedRooms.join(", ")
                    : "No rooms selected yet."}
                </p>
              </div>

              <div className="room-total">
                <small>Estimated Total</small>
                <strong>
                  ₹{totalPrice.toLocaleString("en-IN")}
                </strong>
              </div>
            </div>

            {message && (
              <p className="booking-message">{message}</p>
            )}

            <div className="booking-action-row">
              <button
                type="button"
                className="booking-back-btn"
                onClick={() => {
                  setMessage("");
                  setStep(1);
                }}
              >
                ← Back
              </button>

              <button
                type="button"
                className="booking-next-btn"
                disabled={selectedRooms.length === 0}
                onClick={() => {
                  setMessage("");
                  setStep(3);
                }}
              >
                Enter Details →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: GUEST DETAILS */}
        {step === 3 && (
          <div className="booking-step-content">
            <div className="booking-step-heading">
              <span className="section-label">STEP 03</span>
              <h3>Guest Details</h3>
              <p>Please enter your information to submit your booking.</p>
            </div>

            <form onSubmit={handleBooking}>
              <div className="guest-details-grid">

                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="guestName"
                    placeholder="Enter full name"
                    value={guest.guestName}
                    onChange={handleGuestChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter email address"
                    value={guest.email}
                    onChange={handleGuestChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="10-digit mobile number"
                    pattern="[0-9]{10}"
                    maxLength="10"
                    value={guest.phone}
                    onChange={handleGuestChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Room Type *</label>
                  <select
                    name="roomType"
                    value={guest.roomType}
                    onChange={handleGuestChange}
                  >
                    <option>Deluxe Room</option>
                    <option>Suite Room</option>
                    <option>Standard Room</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Address *</label>
                  <textarea
                    name="address"
                    placeholder="Enter your full address"
                    value={guest.address}
                    onChange={handleGuestChange}
                    rows="3"
                    required
                  ></textarea>
                </div>

                <div className="form-group">
                  <label>Number of Guests *</label>
                  <input
                    type="number"
                    name="guests"
                    min="1"
                    max="20"
                    value={guest.guests}
                    onChange={handleGuestChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Payment Reference / Mode *</label>
                  <select
                    name="paymentMode"
                    value={guest.paymentMode}
                    onChange={handleGuestChange}
                    required
                  >
                    <option>Cash at Hotel</option>
                    <option>UPI</option>
                    <option>Bank Transfer</option>
                    <option>Card at Hotel</option>
                  </select>
                </div>

                {guest.paymentMode !== "Cash at Hotel" &&
                  guest.paymentMode !== "Card at Hotel" && (
                    <div className="form-group full-width">
                      <label>Payment Reference Number</label>
                      <input
                        type="text"
                        name="paymentReference"
                        placeholder="Enter transaction reference"
                        value={guest.paymentReference}
                        onChange={handleGuestChange}
                      />
                    </div>
                )}

                <div className="form-group full-width">
                  <label>Identity Proof (PDF / Image) *</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={e =>
                      setIdentityProof(e.target.files?.[0] || null)
                    }
                    required
                  />
                  <small className="file-help">
                    Maximum file size: 5 MB. Accepted: PDF, JPG, PNG, WEBP.
                  </small>
                </div>

              </div>

              <div className="final-summary">
                <h4>Booking Summary</h4>

                <div className="summary-row">
                  <span>Selected Rooms</span>
                  <strong>{selectedRooms.join(", ")}</strong>
                </div>

                <div className="summary-row">
                  <span>Room Type</span>
                  <strong>{guest.roomType}</strong>
                </div>

                <div className="summary-row">
                  <span>Stay Duration</span>
                  <strong>{nights} night(s)</strong>
                </div>

                <div className="summary-row">
                  <span>Price per room / night</span>
                  <strong>₹{hotel.price.toLocaleString("en-IN")}</strong>
                </div>

                <div className="summary-row">
                  <span>Total Rooms</span>
                  <strong>{selectedRooms.length}</strong>
                </div>

                <div className="final-total">
                  <span>Total</span>
                  <strong>₹{totalPrice.toLocaleString("en-IN")}</strong>
                </div>
              </div>

              {message && (
                <p className="booking-message">{message}</p>
              )}

              <div className="booking-action-row">
                <button
                  type="button"
                  className="booking-back-btn"
                  onClick={() => {
                    setMessage("");
                    setStep(2);
                  }}
                >
                  ← Back to Rooms
                </button>

                <button
                  type="submit"
                  className="booking-next-btn"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Confirm Booking"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 4: SUCCESS */}
        {step === 4 && bookingResult && (
          <div className="booking-success">
            <div className="success-icon">✓</div>
            <span className="section-label">REQUEST RECEIVED</span>
            <h3>Thank You, {bookingResult.guestName}!</h3>
            <p>Your booking request has been submitted successfully.</p>

            <div className="success-details">
              <div>
                <span>Booking Reference</span>
                <strong>{bookingResult._id}</strong>
              </div>

              <div>
                <span>Room Numbers</span>
                <strong>{bookingResult.roomNumbers.join(", ")}</strong>
              </div>

              <div>
                <span>Booking Status</span>
                <strong className="pending-status">Pending Confirmation</strong>
              </div>

              <div>
                <span>Estimated Total</span>
                <strong>
                  ₹{bookingResult.estimatedTotal.toLocaleString("en-IN")}
                </strong>
              </div>
            </div>

            <p className="success-note">
              Your booking is pending hotel confirmation.
              Please contact the hotel for final confirmation.
            </p>

            <button
              type="button"
              className="booking-next-btn"
              onClick={() => window.location.reload()}
            >
              Back to Home
            </button>
          </div>
        )}

      </div>
    </section>
  );
}

export default Booking;
