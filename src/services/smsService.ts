import twilio from "twilio";
import { CONFIG } from "../config";
import { Appointment } from "../types";
import { logger } from "../logger";

const TAG = "SMS";

const client = twilio(CONFIG.twilio.accountSid, CONFIG.twilio.authToken);

export async function sendAppointmentConfirmationSMS(
  appointment: Appointment
): Promise<void> {
  const body =
    `✅ Appointment Confirmed!\n` +
    `Patient: ${appointment.patientName}\n` +
    `Service: ${appointment.service}\n` +
    `Date: ${appointment.date} at ${appointment.time}\n` +
    `📍 Krushna Diagnostic Center, Near HDFC Bank, Indapur, Pune\n` +
    `📞 +91-9405347738\n` +
    `Please carry your ID and doctor's prescription.`;

  await client.messages.create({
    body,
    from: CONFIG.twilio.phoneNumber,
    to: appointment.patientPhone,
  });

  logger.info(TAG, `Confirmation sent to ${appointment.patientPhone}`);
}

export async function sendRescheduleConfirmationSMS(
  appointment: Appointment
): Promise<void> {
  const body =
    `🔄 Appointment Rescheduled!\n` +
    `Patient: ${appointment.patientName}\n` +
    `Service: ${appointment.service}\n` +
    `New Date: ${appointment.date} at ${appointment.time}\n` +
    `📍 Krushna Diagnostic Center, Indapur, Pune\n` +
    `📞 +91-9405347738`;

  await client.messages.create({
    body,
    from: CONFIG.twilio.phoneNumber,
    to: appointment.patientPhone,
  });
  logger.info(TAG, `Reschedule SMS sent to ${appointment.patientPhone}`);
}
