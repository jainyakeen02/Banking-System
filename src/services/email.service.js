const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN
  }
});

// This verifies the OAuth setup at server startup. It does not send an email.
transporter.verify()
  .then(() => console.log("Email server is ready to send messages"))
  .catch(error => console.error("Email server configuration error:", error.message));

async function sendEmail({ to, subject, text, html }) {
  if (!to) throw new Error("A destination email address is required");
  const info = await transporter.sendMail({
    from: `"FlowLedger Demo" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html
  });
  console.log(`Email accepted for delivery: ${to}; messageId=${info.messageId}`);
  return info;
}

async function sendAccountCreatedEmail({ email, name, accountNumber, temporaryPassword, initialBalance }) {
  const subject = "Your FlowLedger account is ready";
  const text = `Hello ${name},\n\nYour FlowLedger account has been created.\nAccount number: ${accountNumber}\nTemporary password: ${temporaryPassword}\nOpening balance: ₹${initialBalance}\n\nPlease sign in and set your four-digit transaction PIN.\n\nFlowLedger Demo`;
  const html = `<p>Hello ${name},</p><p>Your FlowLedger account has been created.</p><p><strong>Account number:</strong> ${accountNumber}<br><strong>Temporary password:</strong> ${temporaryPassword}<br><strong>Opening balance:</strong> ₹${initialBalance}</p><p>Please sign in and set your four-digit transaction PIN.</p>`;
  return sendEmail({ to: email, subject, text, html });
}

async function sendTransferEmail({ email, name, amount, accountNumber, direction, counterpartyAccount }) {
  const isDebit = direction === "DEBIT";
  const subject = isDebit ? "Debit alert: online transfer completed" : "Credit alert: online transfer received";
  const action = isDebit ? "sent" : "received";
  const text = `Hello ${name},\n\n₹${amount} was ${action} successfully.\nYour account: ${accountNumber}\nCounterparty account: ${counterpartyAccount}\n\nFlowLedger Demo`;
  const html = `<p>Hello ${name},</p><p><strong>₹${amount}</strong> was ${action} successfully.</p><p><strong>Your account:</strong> ${accountNumber}<br><strong>Counterparty account:</strong> ${counterpartyAccount}</p>`;
  return sendEmail({ to: email, subject, text, html });
}

async function sendRegistrationEmail(email, name) {
  return sendEmail({
    to: email,
    subject: "Welcome to FlowLedger",
    text: `Hello ${name}, welcome to FlowLedger.`,
    html: `<p>Hello ${name}, welcome to FlowLedger.</p>`
  });
}

module.exports = { sendAccountCreatedEmail, sendTransferEmail, sendRegistrationEmail };
