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

// ─── Shared Layout Wrapper ────────────────────────────────────────────────────
function wrapHtml(title, bodyContent) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Demo Banner -->
          <tr>
            <td style="background:#fff3cd;border-bottom:1px solid #ffc107;padding:10px 28px;text-align:center;">
              <span style="font-size:12px;color:#856404;font-weight:600;letter-spacing:0.5px;">
                ⚠️ DEMO APPLICATION — This is a simulated banking environment for educational purposes only.
              </span>
            </td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1f36 0%,#2d3561 100%);padding:32px 28px;text-align:center;">
              <div style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
                🏦 FlowLedger
              </div>
              <div style="font-size:13px;color:#a0aec0;margin-top:4px;letter-spacing:1px;text-transform:uppercase;">
                Demo Banking System
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 36px 24px;">
              ${bodyContent}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e8ecf0;padding:20px 36px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                This email was sent by <strong>FlowLedger Demo</strong>. Do not reply to this email.<br/>
                This is a demo project — no real money or banking services are involved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Core Send ────────────────────────────────────────────────────────────────
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

// ─── Account Created Email ────────────────────────────────────────────────────
async function sendAccountCreatedEmail({ email, name, accountNumber, temporaryPassword, initialBalance }) {
  const subject = "🎉 Welcome to FlowLedger — Your Account is Ready!";

  const text = `Welcome to FlowLedger, ${name}!

Your demo bank account has been successfully created. Here are your account details:

  Account Number  : ${accountNumber}
  Temporary Password: ${temporaryPassword}
  Opening Balance : ₹${initialBalance.toLocaleString("en-IN")}

IMPORTANT: This is a DEMO application. Please log in and set your four-digit Transaction PIN before making any transfers.

⚠️ DEMO NOTICE: FlowLedger is a simulated banking system built for educational and demonstration purposes only. No real money is involved.

Thank you for joining FlowLedger Demo!
— The FlowLedger Team`;

  const html = wrapHtml("Account Created — FlowLedger", `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1a1f36;">
      Welcome aboard, ${name}! 🎉
    </h2>
    <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.6;">
      Your FlowLedger demo bank account has been <strong>successfully created</strong>.
      Below are your account credentials — please keep them safe.
    </p>

    <!-- Account Details Card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:24px;overflow:hidden;">
      <tr>
        <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;background:#eef2ff;">
          <span style="font-size:13px;font-weight:700;color:#4f46e5;text-transform:uppercase;letter-spacing:0.8px;">Account Details</span>
        </td>
      </tr>
      <tr>
        <td style="padding:20px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">
                <span style="font-size:13px;color:#94a3b8;font-weight:500;">Account Number</span><br/>
                <span style="font-size:18px;font-weight:700;color:#1a1f36;letter-spacing:2px;">${accountNumber}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">
                <span style="font-size:13px;color:#94a3b8;font-weight:500;">Temporary Password</span><br/>
                <span style="font-size:16px;font-weight:700;color:#dc2626;font-family:monospace;">${temporaryPassword}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;">
                <span style="font-size:13px;color:#94a3b8;font-weight:500;">Opening Balance</span><br/>
                <span style="font-size:22px;font-weight:800;color:#16a34a;">₹${Number(initialBalance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Next Steps -->
    <div style="background:#eff6ff;border-left:4px solid #3b82f6;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;font-size:14px;color:#1e40af;font-weight:600;">📋 Next Steps</p>
      <ul style="margin:8px 0 0;padding-left:18px;font-size:13px;color:#1e40af;line-height:1.8;">
        <li>Log in using your email and temporary password above</li>
        <li>Set your <strong>4-digit Transaction PIN</strong> in Security Settings</li>
        <li>Explore your dashboard and transaction history</li>
      </ul>
    </div>

    <!-- Demo Notice -->
    <div style="background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:14px 18px;">
      <p style="margin:0;font-size:13px;color:#713f12;line-height:1.6;">
        <strong>⚠️ Demo Notice:</strong> FlowLedger is a <strong>simulated banking system</strong> created for educational
        and portfolio demonstration purposes. No real money or financial services are involved.
      </p>
    </div>
  `);

  return sendEmail({ to: email, subject, text, html });
}

// ─── Transfer / Transaction Alert Email ──────────────────────────────────────
async function sendTransferEmail({ email, name, amount, accountNumber, direction, counterpartyAccount }) {
  const isDebit = direction === "DEBIT";

  const subject = isDebit
    ? `🔴 Debit Alert — ₹${Number(amount).toLocaleString("en-IN")} Transferred`
    : `🟢 Credit Alert — ₹${Number(amount).toLocaleString("en-IN")} Received`;

  const formattedAmount = `₹${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });

  const text = isDebit
    ? `Debit Alert — FlowLedger\n\nHello ${name},\n\nA debit of ${formattedAmount} has been processed from your account.\n\nTransaction Details:\n  Your Account     : ${accountNumber}\n  Transferred To   : ${counterpartyAccount}\n  Amount Debited   : ${formattedAmount}\n  Date & Time      : ${now} IST\n\nIf you did not authorize this transaction, please contact support immediately.\n\n⚠️ DEMO NOTICE: This is a simulated transaction in the FlowLedger demo system. No real money is involved.\n\n— FlowLedger Team`
    : `Credit Alert — FlowLedger\n\nHello ${name},\n\nA credit of ${formattedAmount} has been received in your account.\n\nTransaction Details:\n  Your Account     : ${accountNumber}\n  Received From    : ${counterpartyAccount}\n  Amount Credited  : ${formattedAmount}\n  Date & Time      : ${now} IST\n\n⚠️ DEMO NOTICE: This is a simulated transaction in the FlowLedger demo system. No real money is involved.\n\n— FlowLedger Team`;

  const accentColor = isDebit ? "#dc2626" : "#16a34a";
  const accentBg    = isDebit ? "#fef2f2" : "#f0fdf4";
  const accentBorder= isDebit ? "#fecaca" : "#bbf7d0";
  const icon        = isDebit ? "🔴" : "🟢";
  const action      = isDebit ? "Debited" : "Credited";
  const label       = isDebit ? "Transferred To" : "Received From";
  const counterparty= isDebit ? counterpartyAccount : counterpartyAccount;

  const html = wrapHtml(`${action} Alert — FlowLedger`, `
    <!-- Amount Hero -->
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:40px;margin-bottom:4px;">${icon}</div>
      <div style="font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">
        Amount ${action}
      </div>
      <div style="font-size:38px;font-weight:800;color:${accentColor};">
        ${formattedAmount}
      </div>
    </div>

    <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">
      Hello <strong>${name}</strong>,<br/>
      ${isDebit
        ? `A debit transaction of <strong>${formattedAmount}</strong> has been successfully processed from your FlowLedger account.`
        : `A credit of <strong>${formattedAmount}</strong> has been received in your FlowLedger account.`
      }
    </p>

    <!-- Transaction Details Card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:${accentBg};border:1px solid ${accentBorder};border-radius:10px;margin-bottom:24px;overflow:hidden;">
      <tr>
        <td style="padding:14px 20px;border-bottom:1px solid ${accentBorder};">
          <span style="font-size:13px;font-weight:700;color:${accentColor};text-transform:uppercase;letter-spacing:0.8px;">Transaction Details</span>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid ${accentBorder};">
                <span style="font-size:12px;color:#94a3b8;font-weight:500;display:block;">Your Account</span>
                <span style="font-size:15px;font-weight:700;color:#1a1f36;letter-spacing:1px;">${accountNumber}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid ${accentBorder};">
                <span style="font-size:12px;color:#94a3b8;font-weight:500;display:block;">${label}</span>
                <span style="font-size:15px;font-weight:700;color:#1a1f36;letter-spacing:1px;">${counterparty}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid ${accentBorder};">
                <span style="font-size:12px;color:#94a3b8;font-weight:500;display:block;">Amount ${action}</span>
                <span style="font-size:16px;font-weight:800;color:${accentColor};">${formattedAmount}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;">
                <span style="font-size:12px;color:#94a3b8;font-weight:500;display:block;">Date & Time (IST)</span>
                <span style="font-size:14px;font-weight:600;color:#1a1f36;">${now}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${isDebit ? `
    <!-- Security Notice -->
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:14px 18px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
        <strong>🔒 Security Notice:</strong> If you did not authorize this transaction,
        please contact support immediately and change your credentials.
      </p>
    </div>` : ""}

    <!-- Demo Notice -->
    <div style="background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:14px 18px;">
      <p style="margin:0;font-size:13px;color:#713f12;line-height:1.6;">
        <strong>⚠️ Demo Notice:</strong> This is a <strong>simulated transaction</strong> in the FlowLedger demo banking system.
        No real money or financial services are involved.
      </p>
    </div>
  `);

  return sendEmail({ to: email, subject, text, html });
}

// ─── Welcome / Registration Email ────────────────────────────────────────────
async function sendRegistrationEmail(email, name) {
  const subject = "🎉 Welcome to FlowLedger Demo!";

  const text = `Welcome to FlowLedger, ${name}!

We're thrilled to have you on board. Your account has been registered successfully.

FlowLedger is a demo banking system built to simulate real-world banking operations. You can explore features like:
  - Secure login & authentication
  - Account management
  - Fund transfers with Transaction PIN
  - Real-time transaction history

⚠️ DEMO NOTICE: FlowLedger is a simulated environment for educational purposes only. No real money is involved.

Get started by logging into your dashboard.

— The FlowLedger Team`;

  const html = wrapHtml("Welcome to FlowLedger", `
    <h2 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#1a1f36;">
      Welcome to FlowLedger, ${name}! 🎉
    </h2>
    <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.6;">
      We're thrilled to have you on board. Your account has been <strong>successfully registered</strong>
      and is ready to use.
    </p>

    <!-- Feature Highlights -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:24px;">
      <tr>
        <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;background:#eef2ff;">
          <span style="font-size:13px;font-weight:700;color:#4f46e5;text-transform:uppercase;letter-spacing:0.8px;">What You Can Do</span>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:6px 0;font-size:14px;color:#374151;">🔐 &nbsp;<strong>Secure Login</strong> with JWT authentication</td></tr>
            <tr><td style="padding:6px 0;font-size:14px;color:#374151;">🏦 &nbsp;<strong>Account Management</strong> — view balances & statements</td></tr>
            <tr><td style="padding:6px 0;font-size:14px;color:#374151;">💸 &nbsp;<strong>Fund Transfers</strong> with 4-digit Transaction PIN</td></tr>
            <tr><td style="padding:6px 0;font-size:14px;color:#374151;">📊 &nbsp;<strong>Real-time Transaction History</strong> & ledger</td></tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:28px;">
      <a href="${process.env.FRONTEND_URL || "#"}"
         style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:8px;letter-spacing:0.3px;">
        Go to My Dashboard →
      </a>
    </div>

    <!-- Demo Notice -->
    <div style="background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:14px 18px;">
      <p style="margin:0;font-size:13px;color:#713f12;line-height:1.6;">
        <strong>⚠️ Demo Notice:</strong> FlowLedger is a <strong>simulated banking system</strong> created for
        educational and portfolio demonstration purposes. No real money or financial services are involved.
      </p>
    </div>
  `);

  return sendEmail({ to: email, subject, text, html });
}

// ─── Cash Deposit / Withdrawal Alert Email ────────────────────────────────────
async function sendCashTransactionEmail({ email, name, accountNumber, amount, type, newBalance, channel }) {
  const isDeposit  = type === "CREDIT";
  const isOnline   = channel === "ONLINE";
  const label      = isDeposit ? "Cash Deposit" : "Cash Withdrawal";
  const icon       = isDeposit ? "🟢" : "🔴";
  const accentColor  = isDeposit ? "#16a34a" : "#dc2626";
  const accentBg     = isDeposit ? "#f0fdf4" : "#fef2f2";
  const accentBorder = isDeposit ? "#bbf7d0" : "#fecaca";
  const channelLabel = isOnline ? "ATM / Online Self-Deposit" : "Cashier (Branch Office)";

  const formattedAmount  = `₹${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  const formattedBalance = `₹${Number(newBalance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });

  const subject = `${icon} ${label} Alert — ${formattedAmount} ${isDeposit ? "Credited" : "Debited"}`;

  const text = `${label} Alert — FlowLedger\n\nHello ${name},\n\nA ${label.toLowerCase()} of ${formattedAmount} has been ${isDeposit ? "credited to" : "debited from"} your account.\n\nTransaction Details:\n  Account Number  : ${accountNumber}\n  Amount          : ${formattedAmount}\n  Channel         : ${channelLabel}\n  New Balance     : ${formattedBalance}\n  Date & Time     : ${now} IST\n\n⚠️ DEMO NOTICE: This is a simulated transaction in the FlowLedger demo system. No real money is involved.\n\n— FlowLedger Team`;

  const html = wrapHtml(`${label} Alert — FlowLedger`, `
    <!-- Amount Hero -->
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:40px;margin-bottom:4px;">${icon}</div>
      <div style="font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">
        ${label}
      </div>
      <div style="font-size:38px;font-weight:800;color:${accentColor};">
        ${formattedAmount}
      </div>
    </div>

    <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">
      Hello <strong>${name}</strong>,<br/>
      A ${label.toLowerCase()} of <strong>${formattedAmount}</strong> has been
      <strong>${isDeposit ? "credited to" : "debited from"}</strong> your FlowLedger account via ${channelLabel}.
    </p>

    <!-- Transaction Details Card -->
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:${accentBg};border:1px solid ${accentBorder};border-radius:10px;margin-bottom:24px;overflow:hidden;">
      <tr>
        <td style="padding:14px 20px;border-bottom:1px solid ${accentBorder};">
          <span style="font-size:13px;font-weight:700;color:${accentColor};text-transform:uppercase;letter-spacing:0.8px;">
            Transaction Details
          </span>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid ${accentBorder};">
                <span style="font-size:12px;color:#94a3b8;font-weight:500;display:block;">Account Number</span>
                <span style="font-size:15px;font-weight:700;color:#1a1f36;letter-spacing:1px;">${accountNumber}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid ${accentBorder};">
                <span style="font-size:12px;color:#94a3b8;font-weight:500;display:block;">Amount ${isDeposit ? "Credited" : "Debited"}</span>
                <span style="font-size:16px;font-weight:800;color:${accentColor};">${formattedAmount}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid ${accentBorder};">
                <span style="font-size:12px;color:#94a3b8;font-weight:500;display:block;">Updated Account Balance</span>
                <span style="font-size:18px;font-weight:800;color:#1a1f36;">${formattedBalance}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid ${accentBorder};">
                <span style="font-size:12px;color:#94a3b8;font-weight:500;display:block;">Channel</span>
                <span style="font-size:14px;font-weight:600;color:#1a1f36;">${channelLabel}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;">
                <span style="font-size:12px;color:#94a3b8;font-weight:500;display:block;">Date & Time (IST)</span>
                <span style="font-size:14px;font-weight:600;color:#1a1f36;">${now}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${!isDeposit ? `
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:14px 18px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
        <strong>🔒 Security Notice:</strong> If you did not authorize this withdrawal,
        please contact support immediately.
      </p>
    </div>` : ""}

    <!-- Demo Notice -->
    <div style="background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:14px 18px;">
      <p style="margin:0;font-size:13px;color:#713f12;line-height:1.6;">
        <strong>⚠️ Demo Notice:</strong> This is a <strong>simulated transaction</strong> in the FlowLedger
        demo banking system. No real money or financial services are involved.
      </p>
    </div>
  `);

  return sendEmail({ to: email, subject, text, html });
}

module.exports = { sendAccountCreatedEmail, sendTransferEmail, sendRegistrationEmail, sendCashTransactionEmail };
