import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { Appointment, AppointmentStore } from "../types";

const DATA_FILE = path.join(__dirname, "../../data/appointments.json");

function readStore(): AppointmentStore {
  if (!fs.existsSync(DATA_FILE)) return { appointments: [] };
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as AppointmentStore;
}

function writeStore(store: AppointmentStore): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
}

export function bookAppointment(data: Omit<Appointment, "id" | "status" | "bookedAt">): Appointment {
  const store = readStore();
  const appointment: Appointment = {
    ...data,
    id: uuidv4(),
    status: "confirmed",
    bookedAt: new Date().toISOString(),
  };
  store.appointments.push(appointment);
  writeStore(store);
  return appointment;
}

export function findAppointmentByPhone(phone: string): Appointment | undefined {
  const store = readStore();
  return store.appointments
    .filter(a => a.patientPhone === phone && a.status === "confirmed")
    .sort((a, b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime())[0];
}

export function rescheduleAppointment(id: string, date: string, time: string): Appointment | null {
  const store = readStore();
  const appt = store.appointments.find(a => a.id === id);
  if (!appt) return null;
  appt.date = date;
  appt.time = time;
  appt.status = "rescheduled";
  writeStore(store);
  return appt;
}

export function cancelAppointment(id: string): boolean {
  const store = readStore();
  const appt = store.appointments.find(a => a.id === id);
  if (!appt) return false;
  appt.status = "cancelled";
  writeStore(store);
  return true;
}

export function getAllAppointments(): Appointment[] {
  return readStore().appointments;
}
