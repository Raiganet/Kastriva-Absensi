import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendOtpEmail(email: string, otp: string) {
  const mailOptions = {
    from: `"Kastriva Absensi" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Kode OTP Reset Password - Kastriva Absensi",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Kastriva Absensi</h1>
          <p style="color: #e0e7ff; margin: 5px 0 0; font-size: 12px;">Reset Password</p>
        </div>
        <div style="background: #0f172a; padding: 30px 20px; border-radius: 0 0 12px 12px; text-align: center;">
          <p style="color: #94a3b8; font-size: 14px; margin: 0 0 20px;">Halo,</p>
          <p style="color: #cbd5e1; font-size: 14px; margin: 0 0 20px;">
            Kode OTP Anda untuk reset password:
          </p>
          <div style="background: #1e293b; border: 2px dashed #6366f1; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #6366f1; letter-spacing: 8px; font-family: monospace;">${otp}</span>
          </div>
          <p style="color: #64748b; font-size: 12px; margin: 20px 0 0;">
            Kode ini berlaku <strong style="color: #f59e0b;">5 menit</strong>.<br>
            Jangan berikan kode ini kepada siapapun.
          </p>
        </div>
        <p style="color: #475569; font-size: 11px; text-align: center; margin-top: 20px;">
          Jika Anda tidak meminta reset password, abaikan email ini.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}
