import twilio from 'twilio';
import config from '../config/env';
import logger from '../utils/logger.util';
import redis from '../config/redis';

const client = twilio(config.sms.accountSid, config.sms.authToken);

interface VerificationData {
  phone: string;
  verificationSid: string;
  createdAt: number;
  attempts: number;
}

export class SMSService {
  private static readonly MAX_VERIFY_ATTEMPTS = 3;
  private static readonly VERIFICATION_TTL = 600; // 10 minutes (Twilio default)

  static async sendVerificationCode(phone: string, userId?: string): Promise<void> {
    if (!config.sms.accountSid || !config.sms.authToken || !config.sms.verifyServiceSid) {
      logger.warn('SMS Verify Service not configured, skipping send');
      return;
    }

    const formattedPhone = this.formatPhoneNumber(phone);
    
    // Check if there's an ongoing verification to avoid spam
    const existingKey = `sms:verification:${formattedPhone}`;
    const existingData = await redis.get(existingKey);
    
    if (existingData) {
      const data: VerificationData = JSON.parse(existingData);
      const timeSinceCreated = Date.now() - data.createdAt;
      
      // Allow new verification only after 1 minute
      if (timeSinceCreated < 60000) {
        throw new Error('Please wait before requesting a new verification code');
      }
    }

    try {
      // Send verification using Twilio Verify API
      const verification = await client.verify.v2
        .services(config.sms.verifyServiceSid)
        .verifications
        .create({
          to: formattedPhone,
          channel: 'sms'
        });

      // Store verification data in Redis
      const verificationData: VerificationData = {
        phone: formattedPhone,
        verificationSid: verification.sid,
        createdAt: Date.now(),
        attempts: 0
      };

      await redis.setex(
        existingKey, 
        this.VERIFICATION_TTL, 
        JSON.stringify(verificationData)
      );

      logger.info(`SMS verification code sent to ${formattedPhone}${userId ? ` for user ${userId}` : ''} - Status: ${verification.status}`);
      
    } catch (error: any) {
      logger.error('Failed to send SMS verification:', error);
      
      // Handle specific Twilio errors
      if (error.code === 60200) {
        throw new Error('Invalid phone number format');
      } else if (error.code === 60202) {
        throw new Error('Phone number verification limit exceeded');
      } else if (error.code === 60203) {
        throw new Error('Phone number is not a valid mobile number');
      }
      
      throw new Error('Failed to send SMS verification code');
    }
  }

  static async verifyCode(phone: string, inputCode: string): Promise<boolean> {
    if (!config.sms.accountSid || !config.sms.authToken || !config.sms.verifyServiceSid) {
      logger.warn('SMS Verify Service not configured, skipping verification');
      return false;
    }

    const formattedPhone = this.formatPhoneNumber(phone);
    const key = `sms:verification:${formattedPhone}`;
    const storedData = await redis.get(key);

    if (!storedData) {
      return false; // No verification in progress
    }

    const verificationData: VerificationData = JSON.parse(storedData);

    // Check attempts limit
    if (verificationData.attempts >= this.MAX_VERIFY_ATTEMPTS) {
      await redis.del(key);
      throw new Error('Maximum verification attempts exceeded');
    }

    try {
      // Verify code using Twilio Verify API
      const verificationCheck = await client.verify.v2
        .services(config.sms.verifyServiceSid)
        .verificationChecks
        .create({
          to: formattedPhone,
          code: inputCode
        });

      if (verificationCheck.status === 'approved') {
        // Remove from Redis on successful verification
        await redis.del(key);
        logger.info(`SMS verification successful for ${formattedPhone}`);
        return true;
      } else {
        // Increment attempts on failed verification
        verificationData.attempts += 1;
        await redis.setex(key, this.VERIFICATION_TTL, JSON.stringify(verificationData));
        logger.warn(`SMS verification failed for ${formattedPhone} - Status: ${verificationCheck.status}`);
        return false;
      }
      
    } catch (error: any) {
      logger.error('Failed to verify SMS code:', error);
      
      // Increment attempts on error
      verificationData.attempts += 1;
      await redis.setex(key, this.VERIFICATION_TTL, JSON.stringify(verificationData));
      
      // Handle specific Twilio errors
      if (error.code === 60202) {
        throw new Error('Verification code has expired');
      } else if (error.code === 60200) {
        throw new Error('Invalid verification code');
      }
      
      return false;
    }
  }

  static async invalidateCode(phone: string): Promise<void> {
    const key = `sms:verification:${phone}`;
    await redis.del(key);
  }

  static formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // If it doesn't start with +, assume it's a local number and add country code
    if (!phone.startsWith('+')) {
      // Default to Peru (+51) - you can change this based on your needs
      return `+51${digits}`;
    }
    
    return `+${digits}`;
  }

  static validatePhoneNumber(phone: string): boolean {
    const formatted = this.formatPhoneNumber(phone);
    // Basic validation: should start with + and have 10-15 digits
    const phoneRegex = /^\+[1-9]\d{9,14}$/;
    return phoneRegex.test(formatted);
  }
}

export default SMSService;
