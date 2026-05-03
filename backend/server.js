/*const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());

/*
  Authentication, MFA, and user management are handled
  entirely by Firebase Authentication.
  This backend is intentionally stateless.
*/

/* ================= OPTIONAL BUSINESS API ================= *
app.post("/payment", (req, res) => {
  // Payment data is already validated and stored in Firestore
  // This endpoint exists for future expansion or auditing
  res.send("Payment received");
});

/* ================= START SERVER ================= 
app.listen(3001, () => {
  console.log("Backend running on port 3001 (Auth handled by Firebase)");
});*/
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");

const app = express();

app.use(express.json());
app.use(helmet());

app.use(cors({
  origin: "http://localhost:3000"
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests. Please try again later."
});

app.use(limiter);

/*
  Authentication and user management are handled
  by Firebase Authentication.
*/

/* ================= PAYMENT VALIDATION ================= */
const paymentValidation = [
  body("recipient")
    .trim()
    .matches(/^[A-Za-z ]{2,50}$/)
    .withMessage("Recipient name must only contain letters and spaces."),

  body("amount")
    .isFloat({ gt: 0 })
    .withMessage("Amount must be greater than 0."),

  body("swiftCode")
    .trim()
    .matches(/^[A-Z0-9]{8,11}$/)
    .withMessage("SWIFT code must be 8 to 11 uppercase letters/numbers."),

  body("currency")
    .trim()
    .matches(/^[A-Z]{3}$/)
    .withMessage("Currency must be 3 uppercase letters.")
];

/* ================= OPTIONAL BUSINESS API ================= */
app.post("/payment", paymentValidation, (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array()
    });
  }

  res.json({
    message: "Payment received securely",
    payment: req.body
  });
});

/* ================= START SERVER ================= */
app.listen(3001, () => {
  console.log("Secure backend running on port 3001 (Auth handled by Firebase)");
});