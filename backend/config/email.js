const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "mail.surcomercial.com.py",
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER || "federico.britez@surcomercial.com.py",
    pass: process.env.EMAIL_PASS || "Surcomercial.fbb",
  },
});

module.exports = transporter;
