
import { useEffect, useState } from "react";
import API from "./services/api";
import "./App.css";

function App() {
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [booking, setBooking] = useState({
    guestName: "",
    phone: "",
    email: "",
    roomType: "Deluxe Room",
    checkIn: "",
    checkOut: "",
    guests: 2
  });

  useEffect(() => {
    const fetchHotel = async () => {
      try {
        const response = await API.get("/hotels");

        const pallasHotel = response.data.hotels.find(
          (item) => item.name === "Hotel Palla's Pride"
        );

        if (pallasHotel) {
          setHotel(pallasHotel);
        } else {
          setError("Hotel Palla's Pride not found.");
        }
      } catch (err) {
        console.error("Hotel API Error:", err);
        setError(
          err.response?.data?.message ||
          "Unable to load hotel details. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchHotel();
  }, []);

  const today = new Date().toLocaleDateString("en-CA");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setBooking((prev) => {
      const updated = {
        ...prev,
        [name]: value
      };

      if (
        name === "checkIn" &&
        updated.checkOut &&
        updated.checkOut <= value
      ) {
        updated.checkOut = "";
      }

      return updated;
    });
  };

  const nights =
    booking.checkIn && booking.checkOut
      ? Math.max(
          0,
          Math.round(
            (new Date(booking.checkOut + "T00:00:00") -
              new Date(booking.checkIn + "T00:00:00")) /
              (1000 * 60 * 60 * 24)
          )
        )
      : 0;

  const totalPrice = hotel && nights > 0
    ? nights * hotel.price
    : 0;

  const handleBooking = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!hotel) {
      setMessage("Hotel details are not available.");
      return;
    }

    if (booking.checkIn < today) {
      setMessage("Please select a valid check-in date.");
      return;
    }

    if (nights < 1) {
      setMessage("Check-out must be after check-in.");
      return;
    }

    if (!/^[0-9]{10}$/.test(booking.phone)) {
      setMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await API.post("/bookings", {
        ...booking,
        hotelId: hotel._id,
        guests: Number(booking.guests)
      });

      setMessage(
        `${response.data.message} Booking Reference: ${response.data.booking._id}`
      );

      setBooking({
        guestName: "",
        phone: "",
        email: "",
        roomType: "Deluxe Room",
        checkIn: "",
        checkOut: "",
        guests: 2
      });
    } catch (err) {
      console.error("Booking Error:", err);

      setMessage(
        err.response?.data?.message ||
        "Booking failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <h2>Welcome to Hotel Palla's Pride</h2>
        <p>Loading your experience...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <h2>Unable to load hotel details</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="app">

      {/* NAVBAR */}
      <header className="navbar">
        <a href="#home" className="brand">
          <span className="brand-icon">P</span>
          <span>
            <strong>{hotel.name}</strong>
            <small>COMFORT • LUXURY • HOSPITALITY</small>
          </span>
        </a>

        <nav className="nav-links">
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#rooms">Rooms</a>
          <a href="#facilities">Facilities</a>
          <a href="#booking">Booking</a>
          <a href="#contact">Contact</a>
        </nav>

        <a href="#booking" className="nav-book-btn">
          Book Your Stay
        </a>
      </header>

      {/* HERO */}
      <section className="hero" id="home">
        <div className="hero-overlay"></div>

        <div className="hero-content">
          <span className="hero-label">
            WELCOME TO {hotel.name.toUpperCase()}
          </span>

          <h1>
            {hotel.tagline || "Comfort and Hospitality"}
          </h1>

          <p>{hotel.description}</p>

          <div className="hero-actions">
            <a href="#booking" className="primary-btn">
              Book Your Stay <span>→</span>
            </a>

            <a href="#about" className="outline-btn">
              Discover More
            </a>
          </div>

          <div className="hero-location">
            <span>⌖</span> {hotel.address}
          </div>
        </div>
      </section>

      {/* HIGHLIGHTS */}
      <section className="highlights">
        <div className="highlight-item">
          <span>✦</span>
          <div>
            <strong>Comfortable Stay</strong>
            <small>Relax and feel at home</small>
          </div>
        </div>

        <div className="highlight-item">
          <span>⌂</span>
          <div>
            <strong>Great Location</strong>
            <small>Located in Nandyal</small>
          </div>
        </div>

        <div className="highlight-item">
          <span>♧</span>
          <div>
            <strong>Guest Services</strong>
            <small>Care at every step</small>
          </div>
        </div>

        <div className="highlight-item">
          <span>♡</span>
          <div>
            <strong>Warm Hospitality</strong>
            <small>Your comfort matters</small>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="about-section section-padding" id="about">
        <div className="about-image">
          <img
            src={hotel.image}
            alt="Hotel Palla's Pride"
          />
          <div className="image-caption">
            <strong>{hotel.name}</strong>
            <span>{hotel.location}</span>
          </div>
        </div>

        <div className="about-content">
          <span className="section-label">GET TO KNOW US</span>
          <h2>A Place Where Comfort Meets Hospitality</h2>

          <p>{hotel.description}</p>

          <p>
            Enjoy a welcoming atmosphere, comfortable accommodation
            and convenient guest services during your stay with us.
          </p>

          <div className="about-details">
            <div>
              <span>Hotel Category</span>
              <strong>{hotel.hotelType}</strong>
            </div>

            <div>
              <span>Our Location</span>
              <strong>{hotel.location}</strong>
            </div>
          </div>

          <a href="#rooms" className="text-link">
            Explore Our Rooms →
          </a>
        </div>
      </section>

      {/* ROOMS */}
      <section className="rooms-section section-padding" id="rooms">
        <div className="section-heading">
          <span className="section-label">STAY WITH US</span>
          <h2>Rooms & Accommodation</h2>
          <p>
            Find your comfort and enjoy a relaxing stay at
            {` ${hotel.name}.`}
          </p>
        </div>

        <div className="room-card">
          <div className="room-image">
            <img src={hotel.image} alt="Hotel room" />
            <span className="room-tag">COMFORTABLE STAY</span>
          </div>

          <div className="room-content">
            <span className="section-label">OUR ACCOMMODATION</span>
            <h3>Comfortable Rooms</h3>

            <p>
              Relax in a welcoming space designed to make your stay
              comfortable and convenient.
            </p>

            <div className="room-features">
              <span>❄ Air Conditioning</span>
              <span>⌁ Wi-Fi</span>
              <span>♧ Room Service</span>
            </div>

            <div className="room-bottom">
              <div>
                <small>Starting from</small>
                <strong>₹{hotel.price.toLocaleString("en-IN")}</strong>
                <small>/ night</small>
              </div>

              <a href="#booking" className="primary-btn">
                Book This Room →
              </a>
            </div>

            <div className="room-timing">
              <span>Check-in: <strong>{hotel.checkIn}</strong></span>
              <span>Check-out: <strong>{hotel.checkOut}</strong></span>
              <span>Available rooms: <strong>{hotel.availableRooms}</strong></span>
            </div>
          </div>
        </div>

        <div className="room-note">
          Room type selection is available in the booking form.
          Please contact the hotel to confirm room-specific rates.
        </div>
      </section>

      {/* FACILITIES */}
      <section className="facilities-section section-padding" id="facilities">
        <div className="section-heading">
          <span className="section-label">MAKE YOUR STAY SPECIAL</span>
          <h2>Hotel Facilities</h2>
          <p>Everything you need for a pleasant stay.</p>
        </div>

        <div className="facility-grid">
          {(hotel.amenities || []).map((item, index) => {
            const icons = ["❄", "⌁", "♧", "♨", "✦", "▣"];

            return (
              <div className="facility-card" key={index}>
                <span className="facility-icon">
                  {icons[index % icons.length]}
                </span>
                <h3>{item}</h3>
              </div>
            );
          })}
        </div>
      </section>

      {/* GUEST SERVICES */}
      <section className="services-section section-padding">
        <div className="section-heading">
          <span className="section-label">WE ARE HERE FOR YOU</span>
          <h2>Guest Services</h2>
          <p>Thoughtful services to make your visit easier.</p>
        </div>

        <div className="service-grid">
          {(hotel.businessFacilities || []).map((item, index) => (
            <div className="service-card" key={index}>
              <span>{index === 0 ? "♙" : "▤"}</span>
              <h3>{item}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* BOOKING */}
      <section className="booking-section section-padding" id="booking">
        <div className="section-heading">
          <span className="section-label">PLAN YOUR VISIT</span>
          <h2>Book Your Stay</h2>
          <p>
            Complete the details below to send your booking request.
          </p>
        </div>

        <div className="booking-layout">
          <div className="booking-form-card">
            <h3>Guest Information</h3>
            <p className="form-intro">
              Please provide your details and preferred stay dates.
            </p>

            <form onSubmit={handleBooking}>
              <div className="booking-grid">

                <div className="form-group">
                  <label>Guest Name *</label>
                  <input
                    type="text"
                    name="guestName"
                    placeholder="Enter your full name"
                    value={booking.guestName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Mobile Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="10-digit mobile number"
                    pattern="[0-9]{10}"
                    maxLength="10"
                    value={booking.phone}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={booking.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Room Type *</label>
                  <select
                    name="roomType"
                    value={booking.roomType}
                    onChange={handleChange}
                    required
                  >
                    <option value="Deluxe Room">Deluxe Room</option>
                    <option value="Suite Room">Suite Room</option>
                    <option value="Standard Room">Standard Room</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Check-in Date *</label>
                  <input
                    type="date"
                    name="checkIn"
                    min={today}
                    value={booking.checkIn}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Check-out Date *</label>
                  <input
                    type="date"
                    name="checkOut"
                    min={booking.checkIn || today}
                    value={booking.checkOut}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Number of Guests *</label>
                  <input
                    type="number"
                    name="guests"
                    min="1"
                    max="20"
                    value={booking.guests}
                    onChange={handleChange}
                    required
                  />
                </div>

              </div>

              <button
                type="submit"
                className="submit-booking"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Booking Request →"}
              </button>

              {message && (
                <div className="booking-message" role="status">
                  {message}
                </div>
              )}
            </form>
          </div>

          <aside className="booking-summary">
            <span className="section-label">YOUR RESERVATION</span>
            <h3>Booking Summary</h3>

            <div className="summary-hotel">
              <img src={hotel.image} alt={hotel.name} />
              <div>
                <strong>{hotel.name}</strong>
                <small>{hotel.location}</small>
              </div>
            </div>

            <div className="summary-row">
              <span>Room Type</span>
              <strong>{booking.roomType}</strong>
            </div>

            <div className="summary-row">
              <span>Price per night</span>
              <strong>₹{hotel.price.toLocaleString("en-IN")}</strong>
            </div>

            <div className="summary-row">
              <span>Check-in</span>
              <strong>{booking.checkIn || "Not selected"}</strong>
            </div>

            <div className="summary-row">
              <span>Check-out</span>
              <strong>{booking.checkOut || "Not selected"}</strong>
            </div>

            <div className="summary-row">
              <span>Guests</span>
              <strong>{booking.guests}</strong>
            </div>

            <div className="summary-row">
              <span>Number of nights</span>
              <strong>{nights}</strong>
            </div>

            <div className="summary-total">
              <span>Estimated Total</span>
              <strong>₹{totalPrice.toLocaleString("en-IN")}</strong>
            </div>

            <p className="summary-note">
              This is an estimated amount based on the hotel's listed
              starting price. Final rates and availability require
              hotel confirmation.
            </p>
          </aside>
        </div>
      </section>

      {/* CONTACT */}
      <footer className="footer" id="contact">
        <div className="footer-main">
          <div className="footer-about">
            <h2>{hotel.name}</h2>
            <p>
              Comfort, convenience and warm hospitality
              for a pleasant stay in Nandyal.
            </p>
          </div>

          <div className="footer-contact">
            <h3>Contact Us</h3>
            <p>⌖ {hotel.address}</p>
            <p>☎ {hotel.phone}</p>
            <p>✉ {hotel.email}</p>
          </div>

          <div className="footer-links">
            <h3>Quick Links</h3>
            <a href="#home">Home</a>
            <a href="#about">About Us</a>
            <a href="#rooms">Our Rooms</a>
            <a href="#booking">Book Now</a>
          </div>
        </div>

        <div className="footer-bottom">
          © 2026 {hotel.name}. All rights reserved.
        </div>
      </footer>

    </div>
  );
}

export default App;
