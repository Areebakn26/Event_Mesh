import nodemailer from 'nodemailer';

export interface CustomSmtpConfig {
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUser?: string | null;
  smtpPass?: string | null;
}

export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  customConfig?: CustomSmtpConfig | null
) => {
  let transporter: nodemailer.Transporter;
  let isEthereal = false;

  // 1. Check if user provided custom SMTP credentials for this project in the UI
  if (customConfig?.smtpHost && customConfig?.smtpUser && customConfig?.smtpPass) {
    console.log(`[Email Service] Using REAL per-project SMTP credentials for ${customConfig.smtpHost}`);
    transporter = nodemailer.createTransport({
      host: customConfig.smtpHost,
      port: customConfig.smtpPort || 587,
      secure: (customConfig.smtpPort === 465),
      auth: {
        user: customConfig.smtpUser,
        pass: customConfig.smtpPass,
      },
    });
  } 
  // 2. Check if global SMTP credentials exist in .env
  else if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    console.log('[Email Service] Using REAL global SMTP server configured in .env');
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } 
  // 3. Fallback to free Ethereal Email mock
  else {
    console.log('[Email Service] No custom or global SMTP config found. Generating Ethereal test account...');
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    isEthereal = true;
  }
  
  const fromName = process.env.SMTP_FROM_NAME || 'EventMesh';
  const fromEmail = customConfig?.smtpUser || process.env.SMTP_FROM_EMAIL || 'no-reply@eventmesh.local';

  const info = await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    html,
  });

  console.log(`[Email Service] Sent to ${to}. Message ID: ${info.messageId}`);
  
  if (isEthereal) {
    console.log(`[Email Service] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
  }

  return { success: true, messageId: info.messageId };
};
