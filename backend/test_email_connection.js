require("dotenv").config();
const nodemailer = require("nodemailer");

const testEmail = async () => {
  console.log("Testing email configuration...");
  console.log(`User: ${process.env.EMAIL_USER}`);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    // Verify connection configuration
    await transporter.verify();
    console.log("✅ Success! Server is ready to take our messages");

    // Send a test email
    const info = await transporter.sendMail({
      from: `"CIVIX Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: "CIVIX Email Test",
      text: "If you receive this, your email configuration is working correctly!",
    });

    console.log("✅ Test email sent: %s", info.messageId);
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.code === "EAUTH") {
      console.log(
        "\nHint: This is an authentication error. Make sure you are using an App Password, NOT your login password.",
      );
    }
  }
};

testEmail();
