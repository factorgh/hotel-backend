import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// Create a transporter object using the SMTP settings
const transporter = nodemailer.createTransport({
  host: "smtp.google.com",
  port: 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Export the transporter
export default transporter;
