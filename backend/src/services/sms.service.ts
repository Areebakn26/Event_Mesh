import twilio from 'twilio';

export interface CustomTwilioConfig {
  twilioSid?: string | null;
  twilioToken?: string | null;
  twilioPhone?: string | null;
}

export const sendSms = async (to: string, message: string, customConfig?: CustomTwilioConfig | null) => {
  const sid = customConfig?.twilioSid || process.env.TWILIO_ACCOUNT_SID;
  const token = customConfig?.twilioToken || process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = customConfig?.twilioPhone || process.env.TWILIO_FROM_NUMBER;

  if (!sid || !token || !fromNumber) {
    console.warn(`[SMS Service] Twilio credentials missing for project. Mocking SMS to ${to}: "${message}"`);
    await new Promise(res => setTimeout(res, 500));
    return { success: true, to, messageId: `mock_sms_${Date.now()}` };
  }

  console.log(`[SMS Service] Sending REAL SMS to ${to} via project Twilio account (${sid.slice(0, 8)}...)...`);
  
  try {
    const client = twilio(sid, token);
    const response = await client.messages.create({
      body: message,
      from: fromNumber,
      to: to
    });
    
    console.log(`[SMS Service] Twilio SMS successfully sent! SID: ${response.sid}`);
    return { success: true, to, messageId: response.sid };
  } catch (error: any) {
    console.error(`[SMS Service] Twilio Error:`, error.message);
    throw error;
  }
};
