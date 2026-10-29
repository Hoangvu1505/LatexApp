import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root or server dir
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const GMAIL_USER = process.env.GMAIL_USER || '';
const GMAIL_APP_PASS = process.env.GMAIL_APP_PASS || '';
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';

export function isSmtpConfigured() {
  return Boolean(GMAIL_USER && GMAIL_APP_PASS);
}

let transporter = null;
if (isSmtpConfigured()) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASS
    }
  });
}

/**
 * Send an email invitation to a collaborator
 */
export async function sendProjectInvitation({
  toEmail,
  inviterName = 'Một thành viên',
  inviterEmail = '',
  projectTitle = 'Dự án LaTeX',
  inviteLink
}) {
  if (!isSmtpConfigured() || !transporter) {
    return {
      sent: false,
      reason: 'Chưa cấu hình tài khoản Gmail gửi thư (GMAIL_USER và GMAIL_APP_PASS)'
    };
  }

  const mailOptions = {
    from: `"TeX-LaTeX Studio" <${GMAIL_USER}>`,
    to: toEmail,
    replyTo: inviterEmail || GMAIL_USER,
    subject: `[Project Invitation] ${inviterName} invited you to collaborate on "${projectTitle}"`,
    text: `Hello,\n\n${inviterName} (${inviterEmail || 'A teammate'}) invited you to collaborate on the LaTeX document "${projectTitle}".\n\nOpen the project link below to start editing:\n${inviteLink}\n\nFeatures:\n- Real-time collaborative editing (6+ concurrent users)\n- Live awareness cursor tracking\n- Instant browser-based PDF compilation\n\nBest regards,\nTeX-LaTeX Studio Team`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 30px 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">TeX-LaTeX Collaborative Studio</h1>
          <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 14px;">Real-Time Collaborative Scientific Document Platform</p>
        </div>
        
        <div style="padding: 32px 24px; color: #1e293b; line-height: 1.6;">
          <p style="font-size: 16px; margin: 0 0 16px 0;">Hello,</p>
          <p style="font-size: 15px; margin: 0 0 16px 0;">
            <strong>${inviterName}</strong> ${inviterEmail ? `(${inviterEmail})` : ''} has invited you to collaborate on a LaTeX project:
          </p>
          
          <div style="background: #f8fafc; border-left: 4px solid #6366f1; padding: 16px; border-radius: 4px; margin: 20px 0;">
            <div style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Document Title:</div>
            <div style="font-size: 17px; font-weight: 700; color: #0f172a; margin-top: 4px;">${projectTitle}</div>
          </div>
          
          <ul style="color: #475569; font-size: 14px; padding-left: 20px; margin: 16px 0 24px 0;">
            <li>Real-time conflict-free collaboration (6+ concurrent users).</li>
            <li>Live awareness cursor tracking with individualized member colors.</li>
            <li>Instant high-performance PDF compilation directly in the browser.</li>
          </ul>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${inviteLink}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 14px 32px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.35);">
              👉 Open Project & Join Collaboration
            </a>
          </div>

          <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; font-size: 12px; color: #94a3b8; word-break: break-all;">
            If the button above does not work, copy and paste this link into your browser:<br>
            <a href="${inviteLink}" style="color: #6366f1;">${inviteLink}</a>
          </div>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Sent] Đã gửi thư mời tới ${toEmail}: ${info.messageId}`);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Error] Lỗi gửi thư tới ${toEmail}:`, error);
    return { sent: false, error: error.message };
  }
}

