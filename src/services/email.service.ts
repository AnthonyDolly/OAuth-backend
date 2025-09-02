import nodemailer from 'nodemailer';
import config from '../config/env';
import logger from '../utils/logger.util';

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: { user: config.email.user, pass: config.email.password }
});

export async function sendEmail(to: string, subject: string, html: string) {
  if (!config.email.user || !config.email.password) {
    logger.warn('Email not configured, skipping send');
    return;
  }
  await transporter.sendMail({ from: config.email.user, to, subject, html });
}

export function buildVerificationEmail(url: string) {
  return `<p>Verifica tu email haciendo clic <a href="${url}">aquí</a>.</p>`;
}

export function buildResetPasswordEmail(url: string) {
  return `<p>Restablece tu contraseña haciendo clic <a href="${url}">aquí</a>.</p>`;
}


